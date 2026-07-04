/**
 * Small helpers shared across the Demand Calendar components. Pure
 * functions so they can be tested in isolation.
 */

import type { ActionKey, DateConfidence, Signal, SignalCategory } from './types';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** Anchor date used for sorting — a single-day signal uses its date;
 *  a period signal uses its start. */
export const anchorDate = (s: Signal): string =>
  s.date ?? s.period?.start ?? '9999-12-31';

/** Anchor month (0–11) — used for grouping and month filter. */
export const anchorMonth = (s: Signal): number =>
  parseInt(anchorDate(s).slice(5, 7), 10) - 1;

/** Short label like "Jan 26" or "Nov 15 → Feb 15". */
export const fmtWhen = (s: Signal): string => {
  if (s.date) {
    const [, m, d] = s.date.split('-');
    return `${MONTHS[parseInt(m, 10) - 1]} ${parseInt(d, 10)}`;
  }
  if (s.period) {
    const start = s.period.start.split('-');
    const end = s.period.end.split('-');
    return `${MONTHS[parseInt(start[1], 10) - 1]} ${parseInt(start[2], 10)} → ${MONTHS[parseInt(end[1], 10) - 1]} ${parseInt(end[2], 10)}`;
  }
  return '—';
};

/** Long month name for month-group headings. */
export const monthName = (m0: number): string => MONTHS_LONG[m0] ?? '';

/** Human label for the signal category chip. */
export const CATEGORY_LABEL: Record<SignalCategory, string> = {
  NATIONAL_HOLIDAY:      'National holiday',
  NATIONAL_OBSERVANCE:   'National observance',
  HINDU_FESTIVAL:        'Hindu festival',
  MUSLIM_FESTIVAL:       'Muslim festival',
  CHRISTIAN_FESTIVAL:    'Christian festival',
  SIKH_FESTIVAL:         'Sikh festival',
  REGIONAL_FESTIVAL:     'Regional festival',
  SPORTS_EVENT:          'Sports event',
  ENTERTAINMENT_RELEASE: 'Entertainment release',
  SCHOOL_CALENDAR:       'School calendar',
  SEASONAL_WINDOW:       'Seasonal window',
  RETAIL_PROMO_WINDOW:   'Retail promo window',
};

export const CATEGORY_TONE: Record<SignalCategory, { bg: string; fg: string; border: string }> = {
  NATIONAL_HOLIDAY:      { bg: 'rgba(96,165,250,0.14)',  fg: '#1d4ed8', border: 'rgba(96,165,250,0.30)' },
  NATIONAL_OBSERVANCE:   { bg: 'rgba(148,163,184,0.18)', fg: '#475569', border: 'rgba(148,163,184,0.30)' },
  HINDU_FESTIVAL:        { bg: 'rgba(249,115,22,0.14)',  fg: '#c2410c', border: 'rgba(249,115,22,0.30)' },
  MUSLIM_FESTIVAL:       { bg: 'rgba(16,185,129,0.14)',  fg: '#047857', border: 'rgba(16,185,129,0.28)' },
  CHRISTIAN_FESTIVAL:    { bg: 'rgba(239,68,68,0.14)',   fg: '#b91c1c', border: 'rgba(239,68,68,0.28)' },
  SIKH_FESTIVAL:         { bg: 'rgba(245,158,11,0.16)',  fg: '#b45309', border: 'rgba(245,158,11,0.32)' },
  REGIONAL_FESTIVAL:     { bg: 'rgba(236,72,153,0.14)',  fg: '#be185d', border: 'rgba(236,72,153,0.28)' },
  SPORTS_EVENT:          { bg: 'rgba(59,130,246,0.14)',  fg: '#1e40af', border: 'rgba(59,130,246,0.30)' },
  ENTERTAINMENT_RELEASE: { bg: 'rgba(167,139,250,0.16)', fg: '#6d28d9', border: 'rgba(167,139,250,0.32)' },
  SCHOOL_CALENDAR:       { bg: 'rgba(20,184,166,0.14)',  fg: '#0f766e', border: 'rgba(20,184,166,0.30)' },
  SEASONAL_WINDOW:       { bg: 'rgba(234,179,8,0.14)',   fg: '#a16207', border: 'rgba(234,179,8,0.30)' },
  RETAIL_PROMO_WINDOW:   { bg: 'rgba(5,150,105,0.14)',   fg: '#047857', border: 'rgba(5,150,105,0.30)' },
};

export const CONFIDENCE_LABEL: Record<DateConfidence, string> = {
  HIGH:              'Fixed date',
  MEDIUM_ANNOUNCED:  'Announced',
  LUNAR_VERIFY:      'Verify locally',
};

export const CONFIDENCE_TONE: Record<DateConfidence, { bg: string; fg: string }> = {
  HIGH:             { bg: 'rgba(16,185,129,0.14)',  fg: '#047857' },
  MEDIUM_ANNOUNCED: { bg: 'rgba(245,158,11,0.16)',  fg: '#b45309' },
  LUNAR_VERIFY:     { bg: 'rgba(239,68,68,0.12)',   fg: '#b91c1c' },
};

export const ACTION_LABEL: Record<string, string> = {
  REVIEW_HISTORICAL: 'Review historical',
  WATCH:             'Watch',
  TEST:              'Test',
  PROMO_PLANNING:    'Promo planning',
  MARKDOWN_PLANNING: 'Markdown planning',
};

export const ACTION_TONE: Record<string, { bg: string; fg: string }> = {
  REVIEW_HISTORICAL: { bg: 'rgba(59,130,246,0.14)',  fg: '#1e40af' },
  WATCH:             { bg: 'rgba(245,158,11,0.16)',  fg: '#b45309' },
  TEST:              { bg: 'rgba(167,139,250,0.16)', fg: '#6d28d9' },
  PROMO_PLANNING:    { bg: 'rgba(16,185,129,0.14)',  fg: '#047857' },
  MARKDOWN_PLANNING: { bg: 'rgba(139,92,246,0.14)',  fg: '#5b21b6' },
};

/** Prettify region codes — "STRONGEST_IN_NORTH" → "Strongest in north". */
export const fmtRegion = (r: string): string =>
  r.replace(/_/g, ' ').toLowerCase().replace(/^./, (c) => c.toUpperCase());

/** ISO date → "Oct 1, 2025" style label. */
export const fmtIsoDate = (iso: string): string => {
  if (!iso || iso === 'N/A_MARKDOWN_WINDOW') return iso;
  const [y, m, d] = iso.split('-');
  return `${MONTHS[parseInt(m, 10) - 1]} ${parseInt(d, 10)}, ${y}`;
};

/** Type alias exported for use by filter UI. */
export type { ActionKey };
