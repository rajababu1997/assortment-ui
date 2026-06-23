/**
 * Demo-only brand + category seed. One category belongs to exactly one brand
 * (via brand_uuid). Replace with Setup-managed master in production.
 *
 * `bands` (per category) carries the 4 paired MRP × cost tiers used by
 * Value Plan (Step 2). Cost top ≈ 0.27 × MRP top within each band so the
 * implied margin stays roughly consistent across tiers (~70% mass / ~73%
 * premium). Real brands tune these per season; here they're frozen seeds.
 */

import type { Brand, Category, MrpBand } from '../types';

// Internal uuids/codes are preserved so any other mock module that joins on
// them (autofill, historical sales, heatmap, recent velocity) keeps working.
// Only the display `name` swaps to recognizable real-world fashion brands.
export const SEED_BRANDS: Brand[] = [
  { uuid: 'brand-a', code: 'ZARA', name: 'Zara' },
  { uuid: 'brand-b', code: 'PUMA', name: 'Puma' },
  { uuid: 'brand-c', code: 'TH',   name: 'Tommy Hilfiger' },
];

// ── Band builders ──────────────────────────────────────────────────────────
// One helper per tier so the seed rows below read as a single line each.
const b = (
  id: MrpBand['id'],
  label: string,
  mrp_min: number,
  mrp_max: number | null,
  cost_min: number,
  cost_max: number,
): MrpBand => ({ id, label, mrp_min, mrp_max, cost_min, cost_max });

export const SEED_CATEGORIES: Category[] = [
  // ── Zara — fashion lifestyle, ~70% margin ─────────────────────────────
  {
    uuid: 'cat-a-tops', brand_uuid: 'brand-a', code: 'ZARA-WTOP', name: "Women's Tops",
    bands: [
      b('entry',     'Entry',      499, 799,   100, 180),
      b('core',      'Core',       799, 1199,  180, 280),
      b('upper',     'Upper',     1199, 1799,  280, 420),
      b('statement', 'Statement', 1799, null,  420, 650),
    ],
  },
  {
    uuid: 'cat-a-shirts', brand_uuid: 'brand-a', code: 'ZARA-MSHRT', name: "Men's Shirts",
    bands: [
      b('entry',     'Entry',      999, 1499,  200, 330),
      b('core',      'Core',      1499, 1999,  330, 450),
      b('upper',     'Upper',     1999, 2999,  450, 680),
      b('statement', 'Statement', 2999, null,  680, 1000),
    ],
  },
  {
    uuid: 'cat-a-dresses', brand_uuid: 'brand-a', code: 'ZARA-DRES', name: 'Dresses',
    bands: [
      b('entry',     'Entry',     1499, 2499,  300, 550),
      b('core',      'Core',      2499, 3499,  550, 800),
      b('upper',     'Upper',     3499, 4999,  800, 1150),
      b('statement', 'Statement', 4999, null, 1150, 1700),
    ],
  },

  // ── Puma — sport & lifestyle, ~70% margin ─────────────────────────────
  {
    uuid: 'cat-b-sports', brand_uuid: 'brand-b', code: 'PUMA-SPRT', name: 'Sports Wear',
    bands: [
      b('entry',     'Entry',     1499, 2499,  400, 650),
      b('core',      'Core',      2499, 3999,  650, 1050),
      b('upper',     'Upper',     3999, 5999, 1050, 1600),
      b('statement', 'Statement', 5999, null, 1600, 2400),
    ],
  },
  {
    uuid: 'cat-b-casual', brand_uuid: 'brand-b', code: 'PUMA-CSL', name: 'Casual Wear',
    bands: [
      b('entry',     'Entry',      999, 1499,  250, 400),
      b('core',      'Core',      1499, 2499,  400, 680),
      b('upper',     'Upper',     2499, 3499,  680, 950),
      b('statement', 'Statement', 3499, null,  950, 1400),
    ],
  },
  {
    uuid: 'cat-b-formal', brand_uuid: 'brand-b', code: 'PUMA-ATHL', name: 'Athleisure',
    bands: [
      b('entry',     'Entry',     1999, 2999,  500, 820),
      b('core',      'Core',      2999, 4499,  820, 1250),
      b('upper',     'Upper',     4499, 6499, 1250, 1800),
      b('statement', 'Statement', 6499, null, 1800, 2700),
    ],
  },

  // ── Tommy Hilfiger — premium, ~73% margin ─────────────────────────────
  {
    uuid: 'cat-c-premium', brand_uuid: 'brand-c', code: 'TH-CLSC', name: 'Classic Collection',
    bands: [
      b('entry',     'Entry',     2999, 4999,  700, 1200),
      b('core',      'Core',      4999, 6999, 1200, 1700),
      b('upper',     'Upper',     6999, 9999, 1700, 2500),
      b('statement', 'Statement', 9999, null, 2500, 3700),
    ],
  },
  {
    uuid: 'cat-c-luxury', brand_uuid: 'brand-c', code: 'TH-ICON', name: 'Iconic Line',
    bands: [
      b('entry',     'Entry',      4999,  7999, 1000, 1750),
      b('core',      'Core',       7999, 12999, 1750, 2900),
      b('upper',     'Upper',     12999, 17999, 2900, 4200),
      b('statement', 'Statement', 17999, null,  4200, 6500),
    ],
  },
];

export function categoriesForBrand(brandUuid: string): Category[] {
  return SEED_CATEGORIES.filter((c) => c.brand_uuid === brandUuid);
}

export function findBrand(uuid: string): Brand | undefined {
  return SEED_BRANDS.find((b) => b.uuid === uuid);
}

export function findCategory(uuid: string): Category | undefined {
  return SEED_CATEGORIES.find((c) => c.uuid === uuid);
}

/** Resolve which band an MRP value falls into. `mrp_max: null` is the
 *  open-ended top band; matched when no other band fits. */
export function findBandForMrp(category: Category, mrp: number): MrpBand | undefined {
  return category.bands.find((band) =>
    mrp >= band.mrp_min && (band.mrp_max === null || mrp < band.mrp_max),
  );
}
