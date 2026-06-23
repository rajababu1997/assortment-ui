import type { CurrentUser } from '@/types/auth';

export type AuthType = 'BASIC' | 'KEYCLOAK' | 'AWS_COGNITO';

export interface TokenSet {
  accessToken: string;
  idToken?: string;
  refreshToken?: string;
  expiresIn?: number;
}

export interface LoginResult {
  tokenSet: TokenSet;
  user: CurrentUser;
}

export interface AuthInitResult {
  isAuthenticated: boolean;
  user?: CurrentUser;
  tokenSet?: TokenSet;
}

export interface IAuthStrategy {
  readonly type: AuthType;

  /**
   * Called once at app startup.
   * - BASIC: reads sessionStorage, restores auth synchronously.
   * - KEYCLOAK: runs keycloak.init() (async, handles redirect callback).
   * - COGNITO: calls fetchAuthSession() to check if Amplify has a live session.
   */
  init(): Promise<AuthInitResult>;

  /**
   * Initiate login.
   * - BASIC / COGNITO: accepts credentials, returns token + user.
   * - KEYCLOAK: triggers PKCE redirect (never returns in current page lifecycle).
   */
  login(_credentials?: { username: string; password: string }): Promise<LoginResult>;

  /** Synchronous — returns the Authorization header value or null. */
  getAuthHeader(): string | null;

  /**
   * Refresh the access token.
   * - BASIC: no-op, returns the existing basic token.
   * - KEYCLOAK: calls keycloak.updateToken().
   * - COGNITO: calls fetchAuthSession({ forceRefresh: true }).
   */
  refreshAccessToken(): Promise<string>;

  /** Full logout — clears local state AND terminates IdP session where supported. */
  logout(): Promise<void>;
}
