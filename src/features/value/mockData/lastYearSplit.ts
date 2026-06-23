/**
 * Demo-only "last-year split" for Value Plan reference chips. Deterministic
 * per (category_uuid, band_id) so the same number always shows for the
 * same chip — no surprises across refreshes. Real implementation would
 * read from the historical OTB / Value Plan archive.
 */

import { DEFAULT_SPLIT } from '../constants';
import type { MrpBand } from '@/features/otb/types';

function simpleHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/**
 * Return a plausible last-year % for the given (category, band) pair.
 * Deterministic: same inputs → same number. Drifts ±5 around the default.
 */
export function mockLastYearPct(categoryUuid: string, bandId: MrpBand['id']): number {
  const base = DEFAULT_SPLIT[bandId];
  const drift = (simpleHash(`${categoryUuid}-${bandId}`) % 11) - 5; // [-5, +5]
  return Math.max(5, Math.min(60, base + drift));
}
