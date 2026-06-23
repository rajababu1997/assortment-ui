import axios from 'axios';
import type { IAuthStrategy, AuthInitResult, LoginResult } from '@/auth/AuthStrategy';
import type { CurrentUser } from '@/types/auth';
import { tokenStore } from '@/auth/tokenStore';
import { environment } from '@/config/environment';
import { STORAGE_KEYS } from '@/constants/storageKeys';
import { fetchUserProfileApi } from '@/services/authApi';
import { secureStorage } from '@/lib/secureStorage';

interface KeycloakTokenResponse {
  access_token: string;
  refresh_token: string;
  id_token?: string;
  expires_in: number;
  refresh_expires_in: number;
  token_type: string;
}

/** Map Keycloak error codes → { status, userMessage }. */
function mapKeycloakError(error: unknown): { status: number; userMessage: string } {
  const httpError = error as {
    response?: { status?: number; data?: { error?: string; error_description?: string } };
    message?: string;
    code?: string;
  };

  const httpStatus = httpError.response?.status ?? 0;
  const keycloakCode = httpError.response?.data?.error ?? '';
  const description = httpError.response?.data?.error_description ?? '';

  console.error('[KeycloakStrategy] auth error:', httpStatus, keycloakCode, description, error);

  // Keycloak error codes
  const codeMap: Record<string, { status: number; userMessage: string }> = {
    invalid_grant: { status: 401, userMessage: 'Invalid username or password.' },
    invalid_client: { status: 401, userMessage: 'Authentication service configuration error.' },
    unauthorized_client: { status: 401, userMessage: 'Client not authorized for this authentication method.' },
    unsupported_grant_type: { status: 400, userMessage: 'Authentication method not supported.' },
    invalid_scope: { status: 400, userMessage: 'Invalid authentication scope.' },
    account_disabled: { status: 403, userMessage: 'Account is disabled. Please contact administrator.' },
    account_temporarily_disabled: { status: 423, userMessage: 'Account temporarily locked. Please try again later.' },
  };

  if (keycloakCode && codeMap[keycloakCode]) return codeMap[keycloakCode];

  // HTTP status fallbacks
  const statusMap: Record<number, string> = {
    0: 'Unable to connect to authentication server. Please check your connection.',
    400: 'Invalid request. Please check your credentials.',
    401: description || 'Invalid username or password.',
    403: 'Access forbidden. Please contact administrator.',
    404: 'Authentication service not found. Please contact administrator.',
    429: 'Too many login attempts. Please try again later.',
    500: 'Authentication service temporarily unavailable. Please try again later.',
    502: 'Authentication service temporarily unavailable. Please try again later.',
    503: 'Authentication service temporarily unavailable. Please try again later.',
  };

  return {
    status: httpStatus || 500,
    userMessage: statusMap[httpStatus] ?? description ?? 'Authentication failed. Please try again.',
  };
}

export class KeycloakStrategy implements IAuthStrategy {
  readonly type = 'KEYCLOAK' as const;

  private get tokenUrl(): string {
    return `${environment.keycloakUrl}/realms/${environment.keycloakRealm}/protocol/openid-connect/token`;
  }

  async init(): Promise<AuthInitResult> {
    // Try to restore session using a stored refresh token
    const storedRefreshToken = secureStorage.getItem(STORAGE_KEYS.KC_REFRESH_TOKEN);
    const storedUser = secureStorage.getItem(STORAGE_KEYS.CURRENT_USER);

    if (!storedRefreshToken || !storedUser) return { isAuthenticated: false };

    try {
      const accessToken = await this.doRefresh(storedRefreshToken);
      const user = JSON.parse(storedUser) as CurrentUser;
      return { isAuthenticated: true, user, tokenSet: { accessToken } };
    } catch {
      secureStorage.removeItem(STORAGE_KEYS.KC_REFRESH_TOKEN);
      return { isAuthenticated: false };
    }
  }

  async login(credentials?: { username: string; password: string }): Promise<LoginResult> {
    if (!credentials) throw new Error('Keycloak password grant requires credentials');

    const params = new URLSearchParams({
      grant_type: 'password',
      client_id: environment.keycloakClientId,
      username: credentials.username,
      password: credentials.password,
    });

    // Include client_secret only if configured (confidential client)
    if (environment.keycloakClientSecret) {
      params.set('client_secret', environment.keycloakClientSecret);
    }

    let tokens: KeycloakTokenResponse;
    try {
      const { data } = await axios.post<KeycloakTokenResponse>(this.tokenUrl, params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      tokens = data;
    } catch (err) {
      throw mapKeycloakError(err);
    }

    tokenStore.setAccessToken(tokens.access_token);
    tokenStore.setRefreshToken(tokens.refresh_token);
    secureStorage.setItem(STORAGE_KEYS.KC_REFRESH_TOKEN, tokens.refresh_token);

    const user = await this.fetchUserProfile(tokens.access_token);
    secureStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));

    return {
      tokenSet: {
        accessToken: tokens.access_token,
        idToken: tokens.id_token,
        refreshToken: tokens.refresh_token,
        expiresIn: tokens.expires_in,
      },
      user,
    };
  }

  getAuthHeader(): string | null {
    const token = tokenStore.getAccessToken();
    return token ? `Bearer ${token}` : null;
  }

  async refreshAccessToken(): Promise<string> {
    const refreshToken = tokenStore.getRefreshToken() ?? secureStorage.getItem(STORAGE_KEYS.KC_REFRESH_TOKEN);
    if (!refreshToken) throw new Error('No refresh token available');
    return this.doRefresh(refreshToken);
  }

  async logout(): Promise<void> {
    const refreshToken = tokenStore.getRefreshToken() ?? secureStorage.getItem(STORAGE_KEYS.KC_REFRESH_TOKEN);
    tokenStore.clear();
    secureStorage.clear();

    if (refreshToken) {
      // Best-effort IdP-level logout (revoke the session)
      try {
        const params = new URLSearchParams({
          client_id: environment.keycloakClientId,
          refresh_token: refreshToken,
        });
        if (environment.keycloakClientSecret) {
          params.set('client_secret', environment.keycloakClientSecret);
        }
        const logoutUrl = `${environment.keycloakUrl}/realms/${environment.keycloakRealm}/protocol/openid-connect/logout`;
        await axios.post(logoutUrl, params, {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });
      } catch {
        // Ignore logout errors — session is already cleared locally
      }
    }
  }

  private async doRefresh(refreshToken: string): Promise<string> {
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: environment.keycloakClientId,
      refresh_token: refreshToken,
    });
    if (environment.keycloakClientSecret) {
      params.set('client_secret', environment.keycloakClientSecret);
    }

    const { data } = await axios.post<KeycloakTokenResponse>(this.tokenUrl, params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    tokenStore.setAccessToken(data.access_token);
    tokenStore.setRefreshToken(data.refresh_token);
    secureStorage.setItem(STORAGE_KEYS.KC_REFRESH_TOKEN, data.refresh_token);

    return data.access_token;
  }

  private async fetchUserProfile(accessToken: string): Promise<CurrentUser> {
    try {
      return await fetchUserProfileApi(accessToken, 'KEYCLOAK');
    } catch (backendError) {
      // Fallback: decode user info from the JWT claims
      console.warn('[KeycloakStrategy] /auth/details failed, decoding JWT claims:', backendError);
      const c = parseJwtPayload(accessToken) ?? {};
      return {
        userName: (c['preferred_username'] as string | undefined) ?? (c['sub'] as string | undefined) ?? '',
        email: c['email'] as string | undefined,
        firstName: c['given_name'] as string | undefined,
        lastName: c['family_name'] as string | undefined,
        fullName: c['name'] as string | undefined,
        role: ((c['realm_access'] as { roles?: string[] } | undefined)?.roles ?? [])[0] ?? '',
      };
    }
  }
}

/** Decode JWT payload without verification (client-side only, for display). */
function parseJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}
