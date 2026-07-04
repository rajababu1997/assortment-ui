/**
 * Builds a row skeleton (brand × category × period) with all five buyer
 * fields set to 0. The recommender needs these row entities to exist on the
 * server so it has something to produce recommendations against — the actual
 * OTB numbers come exclusively from the recommender's response.
 *
 * No client-side heuristic (weights, month multipliers, budget headroom) is
 * applied any more. If the recommender fails to produce a value for a row,
 * that row shows 0 — an obvious signal to the buyer that Auto-Plan needs to
 * be re-run, instead of silently displaying stale placeholder data.
 */

import type { Brand, Category, OtbRow, Period } from '../types';
import { buildOtbCodeFromCategoryCode } from './otbCode';

interface SkeletonInput {
  periods: Period[];
  brands: Brand[];
  categories: Category[];
}

export function generateRowSkeleton(input: SkeletonInput): Record<string, OtbRow[]> {
  const { periods, brands, categories } = input;
  if (periods.length === 0 || categories.length === 0) return {};

  const brandUuidSet = new Set(brands.map((b) => b.uuid));
  const pairs = categories
    .filter((c) => brandUuidSet.has(c.brand_uuid))
    .map((c) => ({
      brand_uuid: c.brand_uuid,
      category_uuid: c.uuid,
      category_code: c.code,
    }));

  const result: Record<string, OtbRow[]> = {};
  for (const period of periods) {
    result[period.key] = pairs.map((pair) => ({
      row_id: `${period.key}-${pair.brand_uuid}-${pair.category_uuid}`,
      otb_code: buildOtbCodeFromCategoryCode(period.key, pair.category_code),
      brand_uuid: pair.brand_uuid,
      category_uuid: pair.category_uuid,
      planned_sales: 0,
      markdowns: 0,
      eom_inventory: 0,
      bom_inventory: 0,
      on_order: 0,
    }));
  }
  return result;
}
