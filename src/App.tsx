import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { GuestRoute } from './routes/GuestRoute';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { AuthenticatedLayout } from './app/layout/AuthenticatedLayout';
import { PublicLayout } from './app/layout/PublicLayout';
import { FullscreenLayout } from './app/layout/FullscreenLayout';
import { useDynamicRoutes } from './routes/DynamicRoutes';
import { useAppSelector } from './hooks/useAppSelector';
import { getHomePage } from './constants/navigation';

const SignInPage = lazy(() => import('./features/auth/SignInPage'));
const ForgotPasswordPage = lazy(() => import('./features/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./features/auth/ResetPasswordPage'));
const SignOutPage = lazy(() => import('./features/auth/SignOutPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function AppRoutes() {
  const authenticated = useDynamicRoutes('authenticated');
  const fullscreen = useDynamicRoutes('fullscreen');
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);

  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route element={<GuestRoute />}>
          <Route path="/sign-in" element={<Suspense fallback={<PageLoader />}><SignInPage /></Suspense>} />
          <Route path="/forgot-password" element={<Suspense fallback={<PageLoader />}><ForgotPasswordPage /></Suspense>} />
          <Route path="/reset-password" element={<Suspense fallback={<PageLoader />}><ResetPasswordPage /></Suspense>} />
        </Route>
        <Route path="/sign-out" element={<Suspense fallback={<PageLoader />}><SignOutPage /></Suspense>} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AuthenticatedLayout />}>{authenticated}</Route>
        <Route element={<FullscreenLayout />}>{fullscreen}</Route>
      </Route>

      <Route path="/" element={<Navigate to={isAuthenticated ? getHomePage() : '/sign-in'} replace />} />
      <Route path="*" element={<Suspense fallback={<PageLoader />}><NotFoundPage /></Suspense>} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
