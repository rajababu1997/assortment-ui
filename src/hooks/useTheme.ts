import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useAppSelector } from '@/hooks/useAppSelector';
import {
  setTheme, toggleDark, setDark,
  toggleSidebar, setSidebarCollapsed,
  setDensity, toggleDensity,
  toggleFullscreenMode, setFullscreenMode,
  type Density,
} from '@/store/slices/themeSlice';
import type { ThemeId } from '@/constants/themes';

export function useTheme() {
  const dispatch = useAppDispatch();
  const { themeId, isDark, sidebarCollapsed, density, fullscreenMode } = useAppSelector(s => s.theme);

  return {
    themeId,
    isDark,
    sidebarCollapsed,
    density,
    fullscreenMode,
    setTheme:            (id: ThemeId) => dispatch(setTheme(id)),
    toggleDark:          ()            => dispatch(toggleDark()),
    setDark:             (v: boolean)  => dispatch(setDark(v)),
    toggleSidebar:       ()            => dispatch(toggleSidebar()),
    setSidebarCollapsed: (v: boolean)  => dispatch(setSidebarCollapsed(v)),
    setDensity:          (d: Density)  => dispatch(setDensity(d)),
    toggleDensity:       ()            => dispatch(toggleDensity()),
    toggleFullscreenMode: ()           => dispatch(toggleFullscreenMode()),
    setFullscreenMode:   (v: boolean)  => dispatch(setFullscreenMode(v)),
  };
}
