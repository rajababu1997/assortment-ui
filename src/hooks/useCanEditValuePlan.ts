import { useAppSelector } from './useAppSelector';

/**
 * True when the logged-in user can write Value Plans.
 *
 * Phase 5 gate: ADMIN OR BUYER (case-insensitive). Everyone else sees the
 * editor in read-only mode. `role` on `CurrentUser` is a comma-separated
 * string (e.g. "ADMIN", "BUYER,USER").
 */
export function useCanEditValuePlan(): boolean {
  const role = useAppSelector((s) => s.auth.user?.role);
  if (!role) return false;
  const tokens = role.split(',').map((r) => r.trim().toLowerCase());
  return tokens.includes('admin') || tokens.includes('buyer');
}
