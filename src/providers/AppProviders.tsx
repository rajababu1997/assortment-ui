import { useEffect, type ReactNode } from 'react';
import { Provider, useDispatch } from 'react-redux';
import { store, type AppDispatch } from '@/store';
import { setUser, clearUser } from '@/store/slices/authSlice';
import { ThemeProvider } from './ThemeProvider';
import { QueryProvider } from './QueryProvider';
import { getAuthStrategy } from '@/auth/authStrategyFactory';
import { secureStorage } from '@/lib/secureStorage';

function AuthInitializer() {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    async function initAuth() {
      try {
        await secureStorage.init();
        const result = await getAuthStrategy().init();
        if (result.isAuthenticated && result.user) dispatch(setUser(result.user));
        else dispatch(clearUser());
      } catch {
        dispatch(clearUser());
      }
    }
    initAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

interface Props {
  children: ReactNode;
}

export function AppProviders({ children }: Props) {
  return (
    <Provider store={store}>
      <QueryProvider>
        <ThemeProvider>
          <AuthInitializer />
          {children}
        </ThemeProvider>
      </QueryProvider>
    </Provider>
  );
}
