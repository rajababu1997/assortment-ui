import {
  signIn as amplifySignIn,
  signOut as amplifySignOut,
  fetchAuthSession,
  fetchUserAttributes,
  getCurrentUser,
} from '@aws-amplify/auth';
import { Amplify } from 'aws-amplify';
import type { IAuthStrategy, AuthInitResult, LoginResult } from '@/auth/AuthStrategy';
import type { CurrentUser } from '@/types/auth';
import { tokenStore } from '@/auth/tokenStore';
import { environment } from '@/config/environment';
import { STORAGE_KEYS } from '@/constants/storageKeys';
import { fetchUserProfileApi } from '@/services/authApi';
import { secureStorage } from '@/lib/secureStorage';

/** Map Amplify v6 error codes → { status, userMessage } for the UI layer. */
function mapCognitoError(error: unknown): { status: number; userMessage: string; original: unknown } {
  const err = error as { name?: string; code?: string; __type?: string; message?: string };
  const code = err.name ?? err.code ?? err.__type ?? 'UnknownError';

  console.error('[CognitoStrategy] auth error:', code, err.message, error);

  const map: Record<string, { status: number; userMessage: string }> = {
    UserNotFoundException: { status: 401, userMessage: 'User not found. Please check your username.' },
    NotAuthorizedException: { status: 401, userMessage: 'Invalid username or password.' },
    UserNotConfirmedException: { status: 403, userMessage: 'Account not verified. Please check your email.' },
    PasswordResetRequiredException: {
      status: 423,
      userMessage: 'Password reset required. Please reset your password.',
    },
    TooManyRequestsException: { status: 429, userMessage: 'Too many attempts. Please try again later.' },
    TooManyFailedAttemptsException: {
      status: 429,
      userMessage: 'Account temporarily locked due to too many failed attempts.',
    },
    InvalidParameterException: { status: 400, userMessage: 'Invalid request. Please check your credentials.' },
    InvalidPasswordException: { status: 400, userMessage: 'Password does not meet requirements.' },
    NetworkError: { status: 503, userMessage: 'Network error. Please check your connection.' },
    EmptySignInUsername: { status: 400, userMessage: 'Username is required.' },
    EmptySignInPassword: { status: 400, userMessage: 'Password is required.' },
  };

  const mapped = map[code];
  if (mapped) return { ...mapped, original: error };

  return {
    status: 500,
    userMessage: err.message ?? 'Authentication failed. Please try again.',
    original: error,
  };
}

export class CognitoStrategy implements IAuthStrategy {
  readonly type = 'AWS_COGNITO' as const;

  constructor() {
    const poolId = environment.cognitoUserPoolId;
    const clientId = environment.cognitoUserPoolClientId;

    if (!poolId || !clientId) {
      console.error(
        '[CognitoStrategy] Missing Cognito config. Set VITE_COGNITO_USER_POOL_ID and VITE_COGNITO_CLIENT_ID in your .env file.'
      );
    }

    Amplify.configure({
      Auth: {
        Cognito: {
          userPoolId: poolId,
          userPoolClientId: clientId,
        },
      },
    });
  }

  async init(): Promise<AuthInitResult> {
    try {
      await getCurrentUser();
      const session = await fetchAuthSession();
      const accessToken = session.tokens?.accessToken?.toString();
      if (!accessToken) return { isAuthenticated: false };

      tokenStore.setAccessToken(accessToken);

      const user = await this.fetchUserProfile(accessToken);
      secureStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));

      return {
        isAuthenticated: true,
        user,
        tokenSet: {
          accessToken,
          idToken: session.tokens?.idToken?.toString(),
        },
      };
    } catch {
      return { isAuthenticated: false };
    }
  }

  async login(credentials?: { username: string; password: string }): Promise<LoginResult> {
    if (!credentials) throw new Error('Cognito requires credentials');

    // Ensure no stale session blocks the new sign-in
    try {
      await amplifySignOut();
    } catch {
      /* ignore */
    }

    try {
      await amplifySignIn({ username: credentials.username, password: credentials.password });
    } catch (signInError) {
      throw mapCognitoError(signInError);
    }

    let session: Awaited<ReturnType<typeof fetchAuthSession>>;
    try {
      session = await fetchAuthSession();
    } catch (sessionError) {
      throw mapCognitoError(sessionError);
    }

    const accessToken = session.tokens?.accessToken?.toString();
    const idToken = session.tokens?.idToken?.toString();

    if (!accessToken) {
      throw {
        status: 500,
        userMessage: 'No access token received from Cognito. Check your User Pool configuration.',
        original: null,
      };
    }

    tokenStore.setAccessToken(accessToken);

    const user = await this.fetchUserProfile(accessToken);
    secureStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));

    return { tokenSet: { accessToken, idToken }, user };
  }

  getAuthHeader(): string | null {
    const token = tokenStore.getAccessToken();
    return token ? `Bearer ${token}` : null;
  }

  async refreshAccessToken(): Promise<string> {
    const session = await fetchAuthSession({ forceRefresh: true });
    const token = session.tokens?.accessToken?.toString() ?? '';
    tokenStore.setAccessToken(token);
    return token;
  }

  async logout(): Promise<void> {
    tokenStore.clear();
    secureStorage.clear();
    await amplifySignOut();
  }

  /** Fetch the isentinel user profile from backend using the Cognito Bearer token. */
  private async fetchUserProfile(accessToken: string): Promise<CurrentUser> {
    try {
      return await fetchUserProfileApi(accessToken, 'AWS_COGNITO');
    } catch (backendError) {
      // Backend /auth/details not configured for Bearer — fall back to Cognito attributes
      console.warn('[CognitoStrategy] /auth/details failed, using Cognito attributes:', backendError);
      try {
        const attrs = await fetchUserAttributes();
        const cognitoUser = await getCurrentUser();
        return {
          userName: cognitoUser.username,
          email: attrs.email,
          firstName: attrs.given_name,
          lastName: attrs.family_name,
          fullName: attrs.name ?? `${attrs.given_name ?? ''} ${attrs.family_name ?? ''}`.trim(),
          role: '',
        };
      } catch (attrError) {
        throw mapCognitoError(attrError);
      }
    }
  }
}
