/**
 * Centralised sessionStorage key constants.
 * All reads/writes go through `secureStorage` using these constants.
 */
export const STORAGE_KEYS = {
  CURRENT_USER: 'currentUser',
  BASIC_AUTH: 'basicAuth',
  KC_REFRESH_TOKEN: 'kc_refresh_token',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
