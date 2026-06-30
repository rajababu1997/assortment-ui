import { SIDEBAR_NAV } from '@/constants/navigation';
import type { NavigationItem } from '@/types/navigation';
import { useUserRoles } from './useUserRoles';

/**
 * Returns the sidebar navigation tree, role-filtered.
 *
 * Currently hardcoded to `SIDEBAR_NAV` with an inline filter for designers
 * (they don't need the Value Planning module). To drive the menu from a
 * backend RBAC endpoint, replace this body with a TanStack Query call and
 * fall back to `SIDEBAR_NAV` when the request fails.
 */
export function useNavigation(): NavigationItem[] {
  const { isDesigner, isAdmin, rawRoles } = useUserRoles();
  const hasBuyerRole = rawRoles.some((r) => r.includes('buyer'));
  // Hide Value Planning for users acting as designer (designer-only, not
  // also a buyer or admin). Buyers + admins keep the full menu.
  const hideValuePlanning = isDesigner && !isAdmin && !hasBuyerRole;
  if (!hideValuePlanning) return SIDEBAR_NAV;
  return SIDEBAR_NAV.filter((item) => item.id !== 'value');
}
