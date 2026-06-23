import axios from 'axios';
import type { IAuthStrategy, AuthInitResult, LoginResult } from '@/auth/AuthStrategy';
import type { CurrentUser } from '@/types/auth';
import { environment } from '@/config/environment';
import { STORAGE_KEYS } from '@/constants/storageKeys';
import { secureStorage } from '@/lib/secureStorage';
import { API_CONFIG } from '@/constants/apiConfig';

/**
 * BasicAuthStrategy — HTTP Basic Authentication (RFC 7617)
 * - Credentials encoded as base64 "username:password"
 * - Token persisted to sessionStorage via secureStorage (AES-256-GCM encrypted)
 * - No refresh mechanism (BASIC tokens are derived from credentials)
 * - Production-ready error handling and validation
 */
export class BasicAuthStrategy implements IAuthStrategy {
  readonly type = 'BASIC' as const;

  /** Cached auth header — loaded once at init, used for all requests. */
  private _authHeader: string | null = null;

  /**
   * Initialize BASIC auth at app startup.
   * Restores token from encrypted sessionStorage if available.
   * Waits for secureStorage decryption to complete before returning.
   */
  async init(): Promise<AuthInitResult> {
    try {
      // CRITICAL: Wait for secureStorage to finish decryption.
      // Without this, sessionStorage values may not yet be in the cache,
      // causing token restore to fail and users to be logged out on refresh.
      await secureStorage.ready;

      // Read encrypted values from sessionStorage (via secureStorage wrapper)
      const storedUser = secureStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      const storedAuth = secureStorage.getItem(STORAGE_KEYS.BASIC_AUTH);

      if (storedUser && storedAuth) {
        const user = JSON.parse(storedUser) as CurrentUser;
        this._authHeader = storedAuth;

        if (import.meta.env.DEV) {
          console.debug('[BasicAuthStrategy] Session restored from sessionStorage', {
            user: user.email,
            tokenLength: storedAuth.length,
          });
        }

        return { isAuthenticated: true, user };
      }

      if (import.meta.env.DEV) {
        console.debug('[BasicAuthStrategy] No stored session found — user must login');
      }
    } catch (err) {
      // Corrupted storage — clear and restart
      if (import.meta.env.DEV) {
        console.warn('[BasicAuthStrategy] Failed to restore session', err);
      }
      secureStorage.clear();
    }

    return { isAuthenticated: false };
  }

  /**
   * Perform login with username + password.
   * Encodes credentials as base64, validates against API, persists token.
   */
  async login(credentials?: { username: string; password: string }): Promise<LoginResult> {
    if (!credentials?.username || !credentials?.password) {
      throw new Error('Username and password are required');
    }

    try {
      // CRITICAL: Ensure secureStorage is initialized before saving token
      // Without this, login might save to plaintext or fail silently
      await secureStorage.ready;

      if (import.meta.env.DEV) {
        console.debug('[BasicAuthStrategy] secureStorage ready, proceeding with login');
      }

      // Encode credentials as RFC 7617 Basic auth token
      const basicToken = 'Basic ' + btoa(`${credentials.username}:${credentials.password}`);

      if (import.meta.env.DEV) {
        console.debug('[BasicAuthStrategy] Encoded credentials as Basic auth token', {
          tokenPrefix: basicToken.substring(0, 10) + '...',
        });
      }

      // Validate credentials and fetch user details
      const { data: user } = await axios.get<CurrentUser>(`${environment.apiUrl}${API_CONFIG.auth.login.url}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: basicToken,
          Client: environment.tenantUid,
        },
        // Skip auth interceptor to prevent loops during login
        skipAuthInterceptor: true,
      } as Record<string, unknown>);

      if (import.meta.env.DEV) {
        console.debug('[BasicAuthStrategy] API returned user', {
          email: user.email,
          role: user.role,
          uuid: user.uuid,
        });
      }

      // Persist to encrypted sessionStorage
      this._authHeader = basicToken;
      secureStorage.setItem(STORAGE_KEYS.BASIC_AUTH, basicToken);
      secureStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));

      // CRITICAL: Flush async encryption to sessionStorage before returning.
      // Without this, encryption might not complete, causing page refresh to fail
      // because hydration will find plaintext where ciphertext is expected.
      await secureStorage.flush();

      if (import.meta.env.DEV) {
        console.debug('[BasicAuthStrategy] ✅ Login successful, tokens persisted', {
          user: user.email,
          basicAuthLength: basicToken.length,
          currentUserLength: JSON.stringify(user).length,
        });

        // Log what's in sessionStorage now
        const stored = secureStorage.getItem(STORAGE_KEYS.BASIC_AUTH);
        const storedUser = secureStorage.getItem(STORAGE_KEYS.CURRENT_USER);
        console.debug('[BasicAuthStrategy] Verified storage', {
          authStored: !!stored,
          userStored: !!storedUser,
          authMatches: stored === basicToken,
        });

        // Extra verification: check sessionStorage directly
        const sessionAuth = sessionStorage.getItem(STORAGE_KEYS.BASIC_AUTH);
        const sessionUser = sessionStorage.getItem(STORAGE_KEYS.CURRENT_USER);
        console.debug('[BasicAuthStrategy] SessionStorage verification', {
          authInSession: !!sessionAuth,
          userInSession: !!sessionUser,
          authIsEncrypted: sessionAuth?.includes('.') ?? false,
        });
      }

      return {
        tokenSet: { accessToken: basicToken },
        user,
      };
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('[BasicAuthStrategy] ❌ Login failed', {
          error: err instanceof Error ? err.message : String(err),
          stack: err instanceof Error ? err.stack : undefined,
        });
      }
      throw err;
    }
  }

  /**
   * Get current Authorization header.
   * First checks in-memory cache, falls back to sessionStorage.
   */
  getAuthHeader(): string | null {
    // In-memory cache (set during init/login)
    if (this._authHeader) return this._authHeader;

    // Fallback to sessionStorage (supports tab restore after init)
    const stored = secureStorage.getItem(STORAGE_KEYS.BASIC_AUTH);
    if (stored) {
      this._authHeader = stored;
    }

    return this._authHeader ?? null;
  }

  /**
   * Refresh access token.
   * BASIC auth has no refresh mechanism — returns existing token.
   * (In production, consider migrating to Bearer tokens with refresh flow)
   */
  async refreshAccessToken(): Promise<string> {
    const token = this.getAuthHeader();
    if (!token) {
      throw new Error('No BASIC auth token available for refresh');
    }
    return token;
  }

  /**
   * Logout — clear local session and optionally notify API.
   * Always clears storage regardless of API success/failure.
   */
  async logout(): Promise<void> {
    const auth = this.getAuthHeader();
    this._authHeader = null;

    try {
      // Notify API of logout (best-effort, errors ignored)
      if (auth) {
        await axios.get(`${environment.apiUrl}${API_CONFIG.auth.logout.url}`, {
          headers: {
            Authorization: auth,
            Client: environment.tenantUid,
          },
          // Skip auth interceptor to prevent 401 loop during logout
          skipAuthInterceptor: true,
          timeout: 5000, // Short timeout — don't block on slow/unreachable logout endpoint
        } as Record<string, unknown>);
      }
    } catch (err) {
      // Ignore logout API errors — session will be cleared regardless
      if (import.meta.env.DEV) {
        console.debug('[BasicAuthStrategy] Logout API call failed (ignored)', err);
      }
    } finally {
      // Always clear storage on logout
      secureStorage.clear();
    }
  }
}
