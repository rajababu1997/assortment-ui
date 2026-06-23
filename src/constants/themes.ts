export const THEMES = [{ id: 'default', cssClass: 'theme-default' }] as const;
export type ThemeId = (typeof THEMES)[number]['id'];
export const DEFAULT_THEME: ThemeId = 'default';
