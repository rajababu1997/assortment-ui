import { useAppSelector } from './useAppSelector';

/**
 * Role-flag bundle for the logged-in user.
 *
 * `role` on `CurrentUser` is a comma-separated string from the backend
 * (e.g. "ADMIN", "BUYER,USER"). Match each token case-insensitively after
 * trimming so "admin", "Admin", "ADMIN" all qualify.
 *
 * ADMIN is treated as the super-set — admins can perform both buyer and
 * designer actions, so `isBuyer` and `isDesigner` return true when the
 * user is an admin too. Callers wanting the *literal* role can read
 * `rawRoles` instead.
 */
export interface UserRoles {
  isAdmin: boolean;
  isBuyer: boolean;
  isDesigner: boolean;
  rawRoles: string[];
}

export function useUserRoles(): UserRoles {
  const role = useAppSelector((s) => s.auth.user?.role);
  const rawRoles = role
    ? role.split(',').map((r) => r.trim().toLowerCase()).filter(Boolean)
    : [];
  // Substring match — backends use varying conventions ("DESIGNER",
  // "ROLE_DESIGNER", "DESIGNER_USER", etc). As long as the relevant word
  // appears anywhere in any token, the flag is true.
  const has = (needle: string): boolean => rawRoles.some((r) => r.includes(needle));
  const isAdmin = has('admin');
  return {
    isAdmin,
    isBuyer: isAdmin || has('buyer'),
    isDesigner: isAdmin || has('designer'),
    rawRoles,
  };
}
