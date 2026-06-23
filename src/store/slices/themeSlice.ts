import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { DEFAULT_THEME, type ThemeId } from '@/constants/themes';

export type Density = 'comfortable' | 'compact';

interface ThemeState {
  themeId: ThemeId;
  isDark: boolean;
  sidebarCollapsed: boolean;
  density: Density;
  fullscreenMode: boolean;
}

const STORAGE_KEY = 'ui_theme';

function loadFromStorage(): ThemeState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        themeId: parsed.themeId ?? DEFAULT_THEME,
        isDark: parsed.isDark ?? false,
        sidebarCollapsed: parsed.sidebarCollapsed ?? false,
        density: parsed.density ?? 'comfortable',
        fullscreenMode: parsed.fullscreenMode ?? false,
      };
    }
  } catch {
    /* ignore */
  }
  return {
    themeId: DEFAULT_THEME,
    isDark: false,
    sidebarCollapsed: false,
    density: 'comfortable',
    fullscreenMode: false,
  };
}

function saveToStorage(state: ThemeState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

const initialState: ThemeState = loadFromStorage();

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setTheme(state, action: PayloadAction<ThemeId>) {
      state.themeId = action.payload;
      saveToStorage({ ...state });
    },
    toggleDark(state) {
      state.isDark = !state.isDark;
      saveToStorage({ ...state });
    },
    setDark(state, action: PayloadAction<boolean>) {
      state.isDark = action.payload;
      saveToStorage({ ...state });
    },
    setSidebarCollapsed(state, action: PayloadAction<boolean>) {
      state.sidebarCollapsed = action.payload;
      saveToStorage({ ...state });
    },
    toggleSidebar(state) {
      state.sidebarCollapsed = !state.sidebarCollapsed;
      saveToStorage({ ...state });
    },
    setDensity(state, action: PayloadAction<Density>) {
      state.density = action.payload;
      saveToStorage({ ...state });
    },
    toggleDensity(state) {
      state.density = state.density === 'comfortable' ? 'compact' : 'comfortable';
      saveToStorage({ ...state });
    },
    toggleFullscreenMode(state) {
      state.fullscreenMode = !state.fullscreenMode;
      saveToStorage({ ...state });
    },
    setFullscreenMode(state, action: PayloadAction<boolean>) {
      state.fullscreenMode = action.payload;
      saveToStorage({ ...state });
    },
  },
});

export const {
  setTheme,
  toggleDark,
  setDark,
  setSidebarCollapsed,
  toggleSidebar,
  setDensity,
  toggleDensity,
  toggleFullscreenMode,
  setFullscreenMode,
} = themeSlice.actions;
export default themeSlice.reducer;
