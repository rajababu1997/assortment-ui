/**
 * Color & severity constants — ported from Angular:
 *   shared/constants/tps-enum-constants.ts
 *
 * Three concerns:
 *   ACTION_ICON_COLOR        — hex colors for table row action icon buttons
 *   ICON_BUTTON_SEVERITY     — PrimeReact Button `severity` prop strings
 *   ICON_BUTTON_COLOR        — hex colors matching PrimeReact severity palette
 *   ACTION_ICON_BUTTON_SEVERITY — hex colors for action icon buttons by semantic role
 *   labelColorDefs           — Tailwind class sets for badge/tag labels
 *   labelColors              — ordered list of available label color keys
 *   labelColorsCodes         — hex codes for label colors (chart / canvas use)
 */

// ── Table Action Icon Colors ───────────────────────────────────────────────
export const ACTION_ICON_COLOR = {
    BLUE:  '#517EBC',
    GRAY:  '#7B8699',
    GREEN: '#55C938',
    RED:   '#ED736B',
} as const;
export type ActionIconColor = typeof ACTION_ICON_COLOR[keyof typeof ACTION_ICON_COLOR];

// ── PrimeReact Button Severity Strings ────────────────────────────────────
export const ICON_BUTTON_SEVERITY = {
    PRIMARY:   '' as const,       // PrimeReact default (no severity prop)
    SECONDARY: 'secondary',
    SUCCESS:   'success',
    INFO:      'info',
    WARNING:   'warning',
    HELP:      'help',
    DANGER:    'danger',
} as const;
export type IconButtonSeverity = typeof ICON_BUTTON_SEVERITY[keyof typeof ICON_BUTTON_SEVERITY];

// ── PrimeReact Button Hex Colors (matches severity palette) ───────────────
export const ICON_BUTTON_COLOR = {
    PRIMARY:   '#3B82F6',
    SECONDARY: '#475569',
    SUCCESS:   '#22c55e',
    INFO:      '#0ea5e9',
    WARNING:   '#f97316',
    HELP:      '#a855f7',
    DANGER:    '#ef4444',
} as const;
export type IconButtonColor = typeof ICON_BUTTON_COLOR[keyof typeof ICON_BUTTON_COLOR];

// ── Action Icon Button Severity (hex, for inline style use) ───────────────
export const ACTION_ICON_BUTTON_SEVERITY = {
    PRIMARY:   '#517EBC',
    SECONDARY: '#7B8699',
    SUCCESS:   '#55C938',
    INFO:      '#0ea5e9',
    WARNING:   '#f97316',
    HELP:      '#a855f7',
    DANGER:    '#ED736B',
} as const;
export type ActionIconButtonSeverity = typeof ACTION_ICON_BUTTON_SEVERITY[keyof typeof ACTION_ICON_BUTTON_SEVERITY];

// ── Label / Badge Color Definitions ───────────────────────────────────────
// Used for status badges, tags, and labels throughout the app.
// Each entry provides Tailwind classes for text-only, bg-only, and combined use.
export const labelColorDefs = {
    gray:   { text: 'text-gray-500',   bg: 'bg-gray-500',   combined: 'text-gray-800 bg-gray-100' },
    red:    { text: 'text-red-500',    bg: 'bg-red-500',    combined: 'text-red-800 bg-red-100' },
    orange: { text: 'text-orange-500', bg: 'bg-orange-500', combined: 'text-orange-800 bg-orange-100' },
    yellow: { text: 'text-yellow-500', bg: 'bg-yellow-500', combined: 'text-yellow-800 bg-yellow-100' },
    green:  { text: 'text-green-500',  bg: 'bg-green-500',  combined: 'text-green-800 bg-green-100' },
    teal:   { text: 'text-teal-500',   bg: 'bg-teal-500',   combined: 'text-teal-800 bg-teal-100' },
    blue:   { text: 'text-blue-500',   bg: 'bg-blue-500',   combined: 'text-blue-800 bg-blue-100' },
    indigo: { text: 'text-indigo-500', bg: 'bg-indigo-500', combined: 'text-indigo-800 bg-indigo-100' },
    purple: { text: 'text-purple-500', bg: 'bg-purple-500', combined: 'text-purple-800 bg-purple-100' },
    pink:   { text: 'text-pink-500',   bg: 'bg-pink-500',   combined: 'text-pink-800 bg-pink-100' },
} as const;
export type LabelColor = keyof typeof labelColorDefs;

// ── Label Color Keys (ordered list for pickers/dropdowns) ─────────────────
export const labelColors: LabelColor[] = [
    'gray', 'red', 'orange', 'yellow', 'green',
    'teal', 'blue', 'indigo', 'purple', 'pink',
];

// ── Label Hex Codes (for chart / canvas rendering) ────────────────────────
export const labelColorsCodes: Record<LabelColor, string> = {
    gray:   '',
    red:    '#f97316',
    orange: '#f97316',
    yellow: '#f97316',
    green:  '#22c55e',
    teal:   '#0ea5e9',
    blue:   '#3B82F6',
    indigo: '#6366f1',
    purple: '#a855f7',
    pink:   '#ed736b',
};
