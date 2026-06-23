import { useAppSelector } from './useAppSelector';

/**
 * True when the logged-in user has admin privileges.
 *
 * `role` on `CurrentUser` is a comma-separated string from the backend
 * (e.g. "ADMIN", "ADMIN,USER"). Match case-insensitively against any
 * whitespace-trimmed token so "admin", "Admin", "ADMIN" all qualify.
 */
export function useIsAdmin(): boolean {
  const role = useAppSelector((s) => s.auth.user?.role);
  if (!role) return false;
  return role
    .split(',')
    .map((r) => r.trim().toLowerCase())
    .includes('admin');
}
