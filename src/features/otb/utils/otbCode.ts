/**
 * OTB code generator.
 *
 * Every OTB row gets a deterministic, human-readable identifier:
 *
 *     OTB-{periodKey}-{categoryCode}
 *
 * Examples:
 *     OTB-2026-04-ZARA-WTOP   (April 2026 · Zara Women's Tops)
 *     OTB-2026-W14-PUMA-SPRT  (Week 14 2026 · Puma Sports Wear)
 *     OTB-2026-Q1-TH-CLSC     (Q1 2026 · Tommy Hilfiger Classic Collection)
 *
 * The category code already encodes the brand (e.g. `ZARA-WTOP`), so it is
 * the only domain field needed in the suffix. See OTB_CODE_SPEC.md for the
 * full backend contract.
 */

// import { findCategory } from '../mockData/brands'; // ← swapped to caller-supplied Category

const OTB_PREFIX = 'OTB';

/**
 * Build a deterministic otb_code from the period key and an already-resolved
 * Category object. Callers MUST look up the category from API data first
 * (via `useBrandCategoryLookup`) — passing the raw uuid is no longer
 * supported because the only stable identifier in the code is the category
 * `code` field.
 */
export function buildOtbCode(
  periodKey: string,
  category: { code: string },
): string {
  return `${OTB_PREFIX}-${periodKey}-${category.code}`;
}

/** Same as buildOtbCode but takes an explicit category code (handy when
 *  the row builder already has it in hand and wants to skip the object). */
export function buildOtbCodeFromCategoryCode(
  periodKey: string,
  categoryCode: string,
): string {
  return `${OTB_PREFIX}-${periodKey}-${categoryCode}`;
}
