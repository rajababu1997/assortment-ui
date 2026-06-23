/**
 * Demo-only previous-period actuals. In production these come from
 * sales + inventory feeds.
 */

import type { MockActuals } from '../types';

const SAMPLE: Omit<MockActuals, 'period_key'> = {
  planned_sales: 60000000,
  actual_sales: 57000000,
  planned_markdowns: 7200000,
  actual_markdowns: 7800000,
  planned_sell_through_pct: 75,
  actual_sell_through_pct: 71,
  planned_eom: 36000000,
  actual_eom: 38000000,
  insight: 'Sales underperformed by ~5%. Consider trimming next period sales forecast and increasing BOM cover.',
};

export function getMockActuals(periodKey: string): MockActuals {
  return { ...SAMPLE, period_key: periodKey };
}
