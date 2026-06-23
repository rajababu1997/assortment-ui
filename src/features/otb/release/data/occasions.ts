/**
 * Demo-only festive / sale calendar.
 *
 * Used by the Sales History "Occasion lens" to overlay any past or
 * upcoming occasion that touches the period being released. Real dates
 * vary by year (lunar / regional / brand cadence) — these are the
 * commonly understood windows for an India fashion brand 2023–2026.
 */

export interface Occasion {
  key: string;
  /** Stable family — links Diwali 2025 to Diwali 2024 etc. */
  family: string;
  label: string;
  /** Inclusive ISO date for the window's first day. */
  start_iso: string;
  /** Inclusive ISO date for the window's last day. */
  end_iso: string;
  /** Expected demand lift over the period baseline. */
  expected_lift_pct: number;
  /** Plain-language note shown next to the occasion badge. */
  note: string;
  /** Category families that benefit most. */
  category_tags?: string[];
}

export const OCCASIONS: Occasion[] = [
  // ── EOSS winter ────────────────────────────────────────────────────────
  { key: 'eoss-w-2024', family: 'eoss-winter', label: 'EOSS · Winter', start_iso: '2024-01-13', end_iso: '2024-02-11', expected_lift_pct: 18, note: 'End-of-season clearance, units up + AUR down + heavy markdowns', category_tags: ['all'] },
  { key: 'eoss-w-2025', family: 'eoss-winter', label: 'EOSS · Winter', start_iso: '2025-01-11', end_iso: '2025-02-09', expected_lift_pct: 18, note: 'End-of-season clearance, units up + AUR down + heavy markdowns', category_tags: ['all'] },
  { key: 'eoss-w-2026', family: 'eoss-winter', label: 'EOSS · Winter', start_iso: '2026-01-10', end_iso: '2026-02-08', expected_lift_pct: 18, note: 'End-of-season clearance, units up + AUR down + heavy markdowns', category_tags: ['all'] },

  // ── Republic Day ───────────────────────────────────────────────────────
  { key: 'rd-2025', family: 'republic-day', label: 'Republic Day sale', start_iso: '2025-01-24', end_iso: '2025-01-28', expected_lift_pct: 20, note: 'Short marketplace push, online tilts further', category_tags: ['all'] },
  { key: 'rd-2026', family: 'republic-day', label: 'Republic Day sale', start_iso: '2026-01-23', end_iso: '2026-01-27', expected_lift_pct: 20, note: 'Short marketplace push, online tilts further', category_tags: ['all'] },

  // ── Holi ───────────────────────────────────────────────────────────────
  { key: 'holi-2024', family: 'holi', label: 'Holi', start_iso: '2024-03-22', end_iso: '2024-03-26', expected_lift_pct: 15, note: 'Casuals, prints, whites, light tees', category_tags: ['casual', 'tops'] },
  { key: 'holi-2025', family: 'holi', label: 'Holi', start_iso: '2025-03-11', end_iso: '2025-03-15', expected_lift_pct: 15, note: 'Casuals, prints, whites, light tees', category_tags: ['casual', 'tops'] },
  { key: 'holi-2026', family: 'holi', label: 'Holi', start_iso: '2026-03-02', end_iso: '2026-03-06', expected_lift_pct: 15, note: 'Casuals, prints, whites, light tees', category_tags: ['casual', 'tops'] },

  // ── EOSS summer ────────────────────────────────────────────────────────
  { key: 'eoss-s-2024', family: 'eoss-summer', label: 'EOSS · Summer', start_iso: '2024-07-13', end_iso: '2024-08-11', expected_lift_pct: 17, note: 'Mid-year clearance, ST jumps + GM compresses', category_tags: ['all'] },
  { key: 'eoss-s-2025', family: 'eoss-summer', label: 'EOSS · Summer', start_iso: '2025-07-12', end_iso: '2025-08-10', expected_lift_pct: 17, note: 'Mid-year clearance, ST jumps + GM compresses', category_tags: ['all'] },
  { key: 'eoss-s-2026', family: 'eoss-summer', label: 'EOSS · Summer', start_iso: '2026-07-11', end_iso: '2026-08-09', expected_lift_pct: 17, note: 'Mid-year clearance, ST jumps + GM compresses', category_tags: ['all'] },

  // ── Independence Day ───────────────────────────────────────────────────
  { key: 'iday-2024', family: 'i-day', label: 'Independence Day sale', start_iso: '2024-08-12', end_iso: '2024-08-16', expected_lift_pct: 25, note: 'One-week sharp spike, marketplace led', category_tags: ['all'] },
  { key: 'iday-2025', family: 'i-day', label: 'Independence Day sale', start_iso: '2025-08-12', end_iso: '2025-08-16', expected_lift_pct: 25, note: 'One-week sharp spike, marketplace led', category_tags: ['all'] },
  { key: 'iday-2026', family: 'i-day', label: 'Independence Day sale', start_iso: '2026-08-12', end_iso: '2026-08-16', expected_lift_pct: 25, note: 'One-week sharp spike, marketplace led', category_tags: ['all'] },

  // ── Onam ───────────────────────────────────────────────────────────────
  { key: 'onam-2024', family: 'onam', label: 'Onam', start_iso: '2024-09-12', end_iso: '2024-09-16', expected_lift_pct: 12, note: 'South India tilt — ethnic, formal, premium', category_tags: ['premium', 'formal'] },
  { key: 'onam-2025', family: 'onam', label: 'Onam', start_iso: '2025-08-31', end_iso: '2025-09-04', expected_lift_pct: 12, note: 'South India tilt — ethnic, formal, premium', category_tags: ['premium', 'formal'] },
  { key: 'onam-2026', family: 'onam', label: 'Onam', start_iso: '2026-08-20', end_iso: '2026-08-25', expected_lift_pct: 12, note: 'South India tilt — ethnic, formal, premium', category_tags: ['premium', 'formal'] },

  // ── Brand Week (Myntra-style) ──────────────────────────────────────────
  { key: 'brand-week-2024', family: 'brand-week', label: 'Brand Week', start_iso: '2024-09-14', end_iso: '2024-09-22', expected_lift_pct: 35, note: 'Highest-velocity online window of the year', category_tags: ['all'] },
  { key: 'brand-week-2025', family: 'brand-week', label: 'Brand Week', start_iso: '2025-09-13', end_iso: '2025-09-21', expected_lift_pct: 35, note: 'Highest-velocity online window of the year', category_tags: ['all'] },
  { key: 'brand-week-2026', family: 'brand-week', label: 'Brand Week', start_iso: '2026-09-12', end_iso: '2026-09-20', expected_lift_pct: 35, note: 'Highest-velocity online window of the year', category_tags: ['all'] },

  // ── Navratri ───────────────────────────────────────────────────────────
  { key: 'navratri-2024', family: 'navratri', label: 'Navratri', start_iso: '2024-10-03', end_iso: '2024-10-12', expected_lift_pct: 30, note: 'Ethnic-wear surge, dresses + tops in festive colors', category_tags: ['tops', 'dresses', 'premium'] },
  { key: 'navratri-2025', family: 'navratri', label: 'Navratri', start_iso: '2025-09-22', end_iso: '2025-10-01', expected_lift_pct: 30, note: 'Ethnic-wear surge, dresses + tops in festive colors', category_tags: ['tops', 'dresses', 'premium'] },
  { key: 'navratri-2026', family: 'navratri', label: 'Navratri', start_iso: '2026-10-10', end_iso: '2026-10-19', expected_lift_pct: 30, note: 'Ethnic-wear surge, dresses + tops in festive colors', category_tags: ['tops', 'dresses', 'premium'] },

  // ── Diwali ─────────────────────────────────────────────────────────────
  { key: 'diwali-2023', family: 'diwali', label: 'Diwali', start_iso: '2023-11-08', end_iso: '2023-11-17', expected_lift_pct: 65, note: 'Peak festive window: burgundy / gold / festive prints, MRP bias up', category_tags: ['all'] },
  { key: 'diwali-2024', family: 'diwali', label: 'Diwali', start_iso: '2024-10-28', end_iso: '2024-11-06', expected_lift_pct: 65, note: 'Peak festive window: burgundy / gold / festive prints, MRP bias up', category_tags: ['all'] },
  { key: 'diwali-2025', family: 'diwali', label: 'Diwali', start_iso: '2025-10-16', end_iso: '2025-10-25', expected_lift_pct: 65, note: 'Peak festive window: burgundy / gold / festive prints, MRP bias up', category_tags: ['all'] },
  { key: 'diwali-2026', family: 'diwali', label: 'Diwali', start_iso: '2026-11-04', end_iso: '2026-11-13', expected_lift_pct: 65, note: 'Peak festive window: burgundy / gold / festive prints, MRP bias up', category_tags: ['all'] },

  // ── Wedding season ─────────────────────────────────────────────────────
  { key: 'wedding-2024', family: 'wedding', label: 'Wedding season', start_iso: '2024-11-15', end_iso: '2025-02-15', expected_lift_pct: 22, note: 'Dresses, ethnic, formal, premium MRP', category_tags: ['dresses', 'premium', 'formal'] },
  { key: 'wedding-2025', family: 'wedding', label: 'Wedding season', start_iso: '2025-11-15', end_iso: '2026-02-15', expected_lift_pct: 22, note: 'Dresses, ethnic, formal, premium MRP', category_tags: ['dresses', 'premium', 'formal'] },
  { key: 'wedding-2026', family: 'wedding', label: 'Wedding season', start_iso: '2026-11-15', end_iso: '2027-02-15', expected_lift_pct: 22, note: 'Dresses, ethnic, formal, premium MRP', category_tags: ['dresses', 'premium', 'formal'] },

  // ── New Year sale ──────────────────────────────────────────────────────
  { key: 'ny-2024', family: 'new-year', label: 'New Year sale', start_iso: '2024-12-26', end_iso: '2024-12-31', expected_lift_pct: 18, note: 'Tail-end clearance, marketplace push', category_tags: ['all'] },
  { key: 'ny-2025', family: 'new-year', label: 'New Year sale', start_iso: '2025-12-26', end_iso: '2025-12-31', expected_lift_pct: 18, note: 'Tail-end clearance, marketplace push', category_tags: ['all'] },
  { key: 'ny-2026', family: 'new-year', label: 'New Year sale', start_iso: '2026-12-26', end_iso: '2026-12-31', expected_lift_pct: 18, note: 'Tail-end clearance, marketplace push', category_tags: ['all'] },
];

function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart <= bEnd && bStart <= aEnd;
}

/** Occasions whose window intersects the given period. */
export function findOverlappingOccasions(periodStartIso: string, periodEndIso: string): Occasion[] {
  const a = new Date(periodStartIso).getTime();
  const b = new Date(periodEndIso).getTime();
  return OCCASIONS.filter((occ) => {
    const oa = new Date(occ.start_iso).getTime();
    const ob = new Date(occ.end_iso).getTime();
    return overlaps(a, b, oa, ob);
  });
}

/**
 * Occasions that start within `daysAhead` after the period ends. Useful
 * to surface "this period is the ramp-up for Diwali" type insights.
 */
export function findRampUpOccasions(periodEndIso: string, daysAhead = 45): Occasion[] {
  const end = new Date(periodEndIso).getTime();
  const horizon = end + daysAhead * 86400_000;
  return OCCASIONS.filter((occ) => {
    const oa = new Date(occ.start_iso).getTime();
    return oa > end && oa <= horizon;
  });
}

/** Past occasions in the same family — used for the LY occasion lens. */
export function getOccasionFamilyHistory(occ: Occasion): Occasion[] {
  return OCCASIONS
    .filter((o) => o.family === occ.family && o.key !== occ.key && new Date(o.start_iso) < new Date(occ.start_iso))
    .sort((a, b) => new Date(b.start_iso).getTime() - new Date(a.start_iso).getTime());
}

/**
 * Convenience: pick the single most impactful occasion (highest lift)
 * for a period — covers both overlap and ramp-up.
 */
export function pickHeadlineOccasion(periodStartIso: string, periodEndIso: string): Occasion | null {
  const candidates = [
    ...findOverlappingOccasions(periodStartIso, periodEndIso),
    ...findRampUpOccasions(periodEndIso, 45),
  ];
  if (candidates.length === 0) return null;
  return [...candidates].sort((a, b) => b.expected_lift_pct - a.expected_lift_pct)[0];
}
