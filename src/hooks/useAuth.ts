import { useAppDispatch } from './useAppDispatch';
import { useAppSelector } from './useAppSelector';
import { signIn, signOut } from '@/store/slices/authSlice';
import type { SignInCredentials } from '@/types/auth';
import { environment } from '@/config/environment';
import { STORAGE_KEYS } from '@/constants/storageKeys';
import { secureStorage } from '@/lib/secureStorage';

export function useAuth() {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, isInitializing, isLoading, error } = useAppSelector((s) => s.auth);

  return {
    user,
    isAuthenticated,
    isInitializing,
    isLoading,
    error,
    /** The active auth strategy type — 'BASIC' | 'KEYCLOAK' | 'AWS_COGNITO'. */
    authType: environment.authType,
    /** Dispatches signIn thunk — use .unwrap() in components to catch errors. */
    signIn: (creds: SignInCredentials) => dispatch(signIn(creds)),
    /** Calls strategy.logout() + clears Redux state. Navigation is the caller's responsibility. */
    signOut: () => dispatch(signOut()),
    /** Synchronous session check — safe to call outside React lifecycle. */
    checkAuth: (): boolean => {
      const raw = secureStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (!raw) return false;
      try {
        JSON.parse(raw);
        return true;
      } catch {
        return false;
      }
    },
  };
}
