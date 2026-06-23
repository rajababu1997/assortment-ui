/**
 * Deterministic demo auto-fill — generates rows for every period using
 * realistic merchandiser ratios, scaled so Σ OTB stays inside the overall
 * budget with ~8% headroom.
 */

// import { SEED_BRANDS, SEED_CATEGORIES } from '../mockData/brands'; // ← swapped to API (pass in via input)
import type { Brand, Category, OtbRow, Period } from '../types';
import { buildOtbCodeFromCategoryCode } from './otbCode';

/**
 * Relative weight per category — roughly mimics real-world volume split
 * between mass / casual / premium lines. Keyed by the stable category
 * `code` (e.g. 'ZARA-WTOP') so it survives UUID changes between mock data
 * and real backend rows.
 */
const ROW_WEIGHTS_BY_CODE: Record<string, number> = {
  'ZARA-WTOP':  1.4, // Women's Tops — biggest seller
  'ZARA-MSHRT': 1.0, // Men's Shirts — steady mid-volume
  'ZARA-DRES':  0.9, // Dresses — seasonal
  'PUMA-SPRT':  0.6, // Sports Wear — smaller category
  'PUMA-CSL':   1.2, // Casual Wear — volume driver
  'PUMA-ATHL':  0.4, // Athleisure — niche
  'TH-CLSC':    0.5, // Premium — low volume, high ticket
  'TH-ICON':    0.3, // Luxury — slowest turn
};

/**
 * Period-of-year multipliers — peak months (festive / EOSS) get more,
 * slow months get less. Index is month-of-year (0 = Jan).
 */
const MONTH_MULTIPLIERS = [
  0.85, 0.80, 0.90, 0.95, 0.95, 1.00, // Jan–Jun
  1.05, 1.05, 1.10, 1.30, 1.25, 1.20, // Jul–Dec (festive ramp)
];

const BUDGET_HEADROOM = 0.92; // allocate 92%, leave 8% headroom

interface AutoFillInput {
  periods: Period[];
  overallBudget: number;
  brands: Brand[];
  categories: Category[];
}

export function generateAutoFilledRows(input: AutoFillInput): Record<string, OtbRow[]> {
  const { periods, overallBudget, brands, categories } = input;
  if (periods.length === 0 || overallBudget <= 0 || categories.length === 0) return {};

  const brandUuidSet = new Set(brands.map((b) => b.uuid));
  const allPairs = categories
    .filter((c) => brandUuidSet.has(c.brand_uuid))
    .map((c) => ({
      brand_uuid: c.brand_uuid,
      category_uuid: c.uuid,
      category_code: c.code,
      weight: ROW_WEIGHTS_BY_CODE[c.code] ?? 0.5,
    }));

  // Total weight = Σ(periodMultiplier × Σ rowWeights) — drives proportional split
  const rowWeightSum = allPairs.reduce((s, p) => s + p.weight, 0);
  const periodWeightSum = periods.reduce((s, p) => {
    const monthIdx = new Date(p.start_iso).getMonth();
    return s + (MONTH_MULTIPLIERS[monthIdx] ?? 1.0);
  }, 0);
  const totalWeight = rowWeightSum * periodWeightSum;
  if (totalWeight === 0) return {};

  const budgetToAllocate = overallBudget * BUDGET_HEADROOM;

  const result: Record<string, OtbRow[]> = {};

  for (const period of periods) {
    const monthIdx = new Date(period.start_iso).getMonth();
    const periodMultiplier = MONTH_MULTIPLIERS[monthIdx] ?? 1.0;

    const rows: OtbRow[] = allPairs.map((pair) => {
      const share = (pair.weight * periodMultiplier) / totalWeight;
      const targetOtb = Math.round(budgetToAllocate * share);
      return rowFromTargetOtb({
        rowId: `${period.key}-${pair.brand_uuid}-${pair.category_uuid}`,
        otbCode: buildOtbCodeFromCategoryCode(period.key, pair.category_code),
        brandUuid: pair.brand_uuid,
        categoryUuid: pair.category_uuid,
        targetOtb,
      });
    });

    result[period.key] = rows;
  }

  return result;
}

/**
 * Inverts the OTB formula to produce the 5 input values from a target OTB.
 *
 * Calibrated to the canonical example:
 *   Sales ₹1,40,00,000 · Markdowns ₹16,80,000 · EOM ₹1,10,00,000
 *   BOM ₹95,00,000 · On Order ₹32,00,000 → OTB ₹1,39,80,000
 *
 * Implied ratios (relative to Planned Sales):
 *   markdowns      = sales × 0.12   (12% — discounts + shrinkage)
 *   eom_inventory  = sales × 0.785  (~3-4 weeks of cover)
 *   bom_inventory  = sales × 0.679  (prior EOM, slightly drawn down)
 *   on_order       = sales × 0.229  (POs already placed, ~23%)
 *
 * Substituting into OTB = sales + md + eom − bom − on_order:
 *   OTB = sales × (1 + 0.12 + 0.785 − 0.679 − 0.229) = sales × 0.997
 *   → sales ≈ OTB (i.e. OTB is roughly the monthly sales line itself).
 *
 * This produces the proper ordering: Planned Sales > EOM > BOM > Markdowns > On Order.
 */
function rowFromTargetOtb(input: {
  rowId: string;
  otbCode: string;
  brandUuid: string;
  categoryUuid: string;
  targetOtb: number;
}): OtbRow {
  const sales = Math.max(0, Math.round(input.targetOtb / 0.997));
  const markdowns = Math.round(sales * 0.12);
  const eom = Math.round(sales * 0.785);
  const bom = Math.round(sales * 0.679);
  const onOrder = Math.round(sales * 0.229);

  return {
    row_id: input.rowId,
    otb_code: input.otbCode,
    brand_uuid: input.brandUuid,
    category_uuid: input.categoryUuid,
    planned_sales: sales,
    markdowns,
    eom_inventory: eom,
    bom_inventory: bom,
    on_order: onOrder,
  };
}
