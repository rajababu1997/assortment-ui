import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppSelector } from '@/hooks/useAppSelector';

/**
 * Mirrors Angular's AuthGuard.
 *
 * - While the auth strategy is initializing (KEYCLOAK silent SSO / Cognito session
 *   check), renders nothing — prevents a flash-redirect to /sign-in.
 * - Once initialized, redirects unauthenticated users to /sign-in with a redirectURL.
 */
export function ProtectedRoute() {
  const location = useLocation();
  const { isAuthenticated, isInitializing } = useAppSelector((s) => s.auth);

  if (isInitializing) {
    // Blank hold while auth strategy resolves — avoids false redirect
    return null;
  }

  if (!isAuthenticated) {
    const redirectURL = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/sign-in?redirectURL=${redirectURL}`} replace />;
  }

  return <Outlet />;
}
