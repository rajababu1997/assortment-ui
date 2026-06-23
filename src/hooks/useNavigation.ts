import { SIDEBAR_NAV } from '@/constants/navigation';
import type { NavigationItem } from '@/types/navigation';

/**
 * Returns the sidebar navigation tree.
 *
 * Currently hardcoded to `SIDEBAR_NAV`. To drive the menu from a backend
 * RBAC endpoint, replace this body with a TanStack Query call and fall back
 * to `SIDEBAR_NAV` when the request fails.
 */
export function useNavigation(): NavigationItem[] {
  return SIDEBAR_NAV;
}
