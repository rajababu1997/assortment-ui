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
import { SpinnerCenter } from './components/primitives';

const SignInPage = lazy(() => import('./features/auth/SignInPage'));
const ForgotPasswordPage = lazy(() => import('./features/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./features/auth/ResetPasswordPage'));
const SignOutPage = lazy(() => import('./features/auth/SignOutPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

function AppRoutes() {
  const authenticated = useDynamicRoutes('authenticated');
  const fullscreen = useDynamicRoutes('fullscreen');
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);

  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route element={<GuestRoute />}>
          <Route path="/sign-in" element={<Suspense fallback={<SpinnerCenter />}><SignInPage /></Suspense>} />
          <Route path="/forgot-password" element={<Suspense fallback={<SpinnerCenter />}><ForgotPasswordPage /></Suspense>} />
          <Route path="/reset-password" element={<Suspense fallback={<SpinnerCenter />}><ResetPasswordPage /></Suspense>} />
        </Route>
        <Route path="/sign-out" element={<Suspense fallback={<SpinnerCenter />}><SignOutPage /></Suspense>} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AuthenticatedLayout />}>{authenticated}</Route>
        <Route element={<FullscreenLayout />}>{fullscreen}</Route>
      </Route>

      <Route path="/" element={<Navigate to={isAuthenticated ? getHomePage() : '/sign-in'} replace />} />
      <Route path="*" element={<Suspense fallback={<SpinnerCenter />}><NotFoundPage /></Suspense>} />
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
