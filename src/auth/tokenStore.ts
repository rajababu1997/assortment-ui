/**
 * In-memory token store for Bearer auth strategies (KEYCLOAK, AWS_COGNITO).
 *
 * Intentionally NOT persisted to localStorage/sessionStorage — keeping tokens
 * in JS memory eliminates XSS-based token theft from storage APIs.
 *
 * Tokens are lost on page refresh; strategies re-acquire them via their
 * init() method (silent SSO check for Keycloak, Amplify session for Cognito).
 */
let _accessToken: string | null = null;
let _refreshToken: string | null = null;

export const tokenStore = {
  setAccessToken: (token: string | null) => {
    _accessToken = token;
  },
  setRefreshToken: (token: string | null) => {
    _refreshToken = token;
  },
  getAccessToken: () => _accessToken,
  getRefreshToken: () => _refreshToken,
  clear: () => {
    _accessToken = null;
    _refreshToken = null;
  },
};
