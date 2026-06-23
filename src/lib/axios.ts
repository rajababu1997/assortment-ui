import axios, { type InternalAxiosRequestConfig, type AxiosResponse } from 'axios';
import { handleApiError } from '@/lib/apiErrorHandler';
import { environment } from '@/config/environment';
import { API_CONFIG } from '@/constants/apiConfig';
import { getAuthStrategy } from '@/auth/authStrategyFactory';
import { secureStorage } from '@/lib/secureStorage';

type RetriableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
  skipAuthInterceptor?: boolean;
};

/**
 * Authenticated Axios instance for all protected API calls.
 * Mirrors Angular's authInterceptor exactly:
 *   - Injects Authorization + Client headers
 *   - Sends `auth: authType` header for non-BASIC strategies (lets backend verify token type)
 *   - Skips auth/IdP domains (prevents refresh loop on token endpoint 401s)
 *   - Handles 401/403 with one silent refresh + retry (same as Angular)
 *   - Queues parallel requests during an in-flight refresh
 */
export const apiClient = axios.create({
  baseURL: environment.apiUrl,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // send session cookie cross-origin (Tapas SessionService)
  timeout: 30000,
  paramsSerializer: (params) => {
    const entries = Object.entries(params).filter(([, v]) => v != null && v !== '');
    return entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v as string)}`).join('&');
  },
});

/**
 * Unauthenticated-credentials Axios instance for the Edge API.
 * The edge API server returns Access-Control-Allow-Origin: * which the browser
 * blocks when withCredentials is true. Edge endpoints auth via headers only
 * (Authorization + Client), so cookies are not needed.
 */
export const edgeApiClient = axios.create({
  headers: { 'Content-Type': 'application/json' },
  withCredentials: false,
  timeout: 30000,
});

edgeApiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  // Wait for secureStorage to finish decryption (same as apiClient)
  await secureStorage.ready;

  const strategy = getAuthStrategy();
  const authHeader = strategy.getAuthHeader();
  if (authHeader) {
    config.headers['Authorization'] = authHeader;
    config.headers['Client'] = environment.tenantUid;
    config.headers['tenantUid'] = environment.tenantUid;
    config.headers['tuid'] = environment.tenantUid;
    if (strategy.type !== 'BASIC') {
      config.headers['auth'] = strategy.type;
    }
  }
  return config;
});

edgeApiClient.interceptors.response.use(
  (res: AxiosResponse) => res,
  (error) => handleApiError(error)
);

// Domains whose 401/403 responses must NOT trigger a token refresh
// (these ARE the auth/IdP endpoints — refreshing against them causes a loop)
const AUTH_DOMAIN_SKIP_LIST = [
  'cognito-idp',
  'amazonaws.com',
  'appsync-api',
  'realms', // Keycloak token + logout endpoints
];

function shouldSkipAuth(url: string): boolean {
  return AUTH_DOMAIN_SKIP_LIST.some((domain) => url.includes(domain));
}

// ── Request interceptor ───────────────────────────────────────────────────────
apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  // CRITICAL: Wait for secureStorage to finish decrypting sessionStorage
  // before attempting to read auth token. Prevents race condition where
  // requests fire before token is available, causing false 401s.
  await secureStorage.ready;

  const strategy = getAuthStrategy();
  const authHeader = strategy.getAuthHeader();

  if (authHeader) {
    config.headers['Authorization'] = authHeader;
    config.headers['Client'] = environment.tenantUid;
    config.headers['tenantUid'] = environment.tenantUid;
    config.headers['tuid'] = environment.tenantUid;

    // Tell the backend which auth type to validate against (Angular gap #1)
    if (strategy.type !== 'BASIC') {
      config.headers['auth'] = strategy.type;
    }
  }

  return config;
});

// ── 401/403 refresh queue ─────────────────────────────────────────────────────
let isRefreshing = false;
let refreshQueue: Array<{ resolve: (_token: string) => void; reject: (_err: unknown) => void }> = [];

function drainQueue(err: unknown, token: string | null) {
  refreshQueue.forEach(({ resolve, reject }) => (err ? reject(err) : resolve(token!)));
  refreshQueue = [];
}

// ── Response interceptor ──────────────────────────────────────────────────────
apiClient.interceptors.response.use(
  (res: AxiosResponse) => res,
  async (error) => {
    const originalRequest = error.config as RetriableRequestConfig | undefined;
    const status = error.response?.status;
    const requestUrl = originalRequest?.url ?? '';

    // Only intercept 401 and 403 (Angular also handles 403)
    const isAuthError = status === 401 || status === 403;

    // Skip: not auth error, already retried, skip-list endpoint, or has skipAuthInterceptor flag
    if (
      !isAuthError ||
      !originalRequest ||
      originalRequest._retry ||
      shouldSkipAuth(requestUrl) ||
      originalRequest.skipAuthInterceptor
    ) {
      return handleApiError(error);
    }

    // ── BASIC auth: attempt silent session re-establishment on first 401 ───────
    if (getAuthStrategy().type === 'BASIC') {
      const authHeader = getAuthStrategy().getAuthHeader();

      // No stored credentials — nothing to retry with, go straight to login
      if (!authHeader) {
        secureStorage.clear();
        const redirectURL = encodeURIComponent(window.location.pathname + window.location.search);
        window.location.href = `/sign-in?redirectURL=${redirectURL}`;
        return handleApiError(error);
      }

      // First 401 — the server-side session cookie may have expired while the
      // BASIC credentials are still valid. Re-hit the login endpoint to
      // re-establish the session cookie, then retry the original request.
      originalRequest._retry = true;
      try {
        await axios.get(`${environment.apiUrl}${API_CONFIG.auth.login.url}`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: authHeader,
            Client: environment.tenantUid,
          },
          skipAuthInterceptor: true,
        } as Record<string, unknown>);
        // Session re-established — retry the original request
        return apiClient(originalRequest);
      } catch {
        // Re-auth also failed — credentials are invalid or server error
        secureStorage.clear();
        const redirectURL = encodeURIComponent(window.location.pathname + window.location.search);
        window.location.href = `/sign-in?redirectURL=${redirectURL}`;
        return handleApiError(error);
      }
    }

    // ── Bearer/OIDC auth: attempt token refresh ───────────────────────────────
    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        refreshQueue.push({ resolve, reject });
      }).then((newToken) => {
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        originalRequest.headers['auth'] = getAuthStrategy().type;
        return apiClient(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const newToken = await getAuthStrategy().refreshAccessToken();
      drainQueue(null, newToken);

      // Retry with both Authorization and auth headers (Angular gap #4)
      originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
      originalRequest.headers['auth'] = getAuthStrategy().type;
      return apiClient(originalRequest);
    } catch (refreshError) {
      drainQueue(refreshError, null);
      if (import.meta.env.DEV) {
        console.error('[Axios Interceptor] Token refresh failed — logging out', refreshError);
      }
      getAuthStrategy()
        .logout()
        .catch(() => {})
        .finally(() => {
          const redirectURL = encodeURIComponent(window.location.pathname + window.location.search);
          window.location.href = `/sign-in?redirectURL=${redirectURL}`;
        });
      return handleApiError(error);
    } finally {
      isRefreshing = false;
    }
  }
);
