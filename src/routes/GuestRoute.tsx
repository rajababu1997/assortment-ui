import { Navigate, Outlet } from 'react-router-dom';
import { useAppSelector } from '@/hooks/useAppSelector';
import { getHomePage } from '@/constants/navigation';

export function GuestRoute() {
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  if (isAuthenticated) return <Navigate to={getHomePage()} replace />;
  return <Outlet />;
}
