import { useEffect, type ReactNode } from 'react';
import { useTheme } from '@/hooks/useTheme';

interface Props {
  children: ReactNode;
}

export function ThemeProvider({ children }: Props) {
  const { isDark, density } = useTheme();

  useEffect(() => {
    const html = document.documentElement;
    if (isDark) html.classList.add('dark');
    else html.classList.remove('dark');
  }, [isDark]);

  useEffect(() => {
    const html = document.documentElement;
    if (density === 'compact') html.classList.add('density-compact');
    else html.classList.remove('density-compact');
  }, [density]);

  return <>{children}</>;
}
