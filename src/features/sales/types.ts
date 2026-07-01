/**
 * Sales DTOs — mirror the Kotlin shapes returned by `/sales/*` endpoints.
 *
 * Single source of truth for everything that used to live under
 * `features/*\/mockData/` (deleted in Phase 1). Same types power the
 * recommendation engine consumers in Phase 2.
 */

export interface SalesAggregateRow {
  periodKey: string;            // YYYY-MM
  brandUuid: string;
  categoryUuid: string;
  bandId: string;               // entry | core | upper | statement
  bomUnits: number;
  bomValue: number;
  receivedUnits: number;
  receivedValue: number;
  optionsActive: number;
  grossSalesUnits: number;
  grossSalesValue: number;
  returnsUnits: number;
  returnsValue: number;
  netSalesUnits: number;
  netSalesValue: number;
  markdownValue: number;
  markdownPct: number;
  cogsValue: number;
  gpValue: number;
  gpPct: number;
  avgMrp: number;
  avgSellingPrice: number;
  avgCost: number;
  eomUnits: number;
  eomValue: number;
  strPct: number;
  weeksCover: number;
  stockoutDays: number;
}

export interface SalesAttributeRow {
  periodKey: string;
  brandUuid: string;
  categoryUuid: string;
  bandId: string;
  optionType: string;           // fabric_type | fit | composition
  subTypeKey: string;
  units: number;
  value: number;
  markdownValue: number;
  markdownPct: number;
  gpValue: number;
  gpPct: number;
  strPct: number;
}

export interface SalesKpiSummary {
  from?: string;
  to?: string;
  rowCount: number;
  grossSalesValue: number;
  netSalesValue: number;
  grossSalesUnits: number;
  netSalesUnits: number;
  returnsValue: number;
  returnsUnits: number;
  markdownValue: number;
  cogsValue: number;
  gpValue: number;
  gpPct: number;
  markdownPct: number;
  returnsPct: number;
  strPct: number;
  stockoutDaysTotal: number;
}

export interface MonthlyTrendPoint {
  periodKey: string;
  netSalesValue: number;
  grossSalesValue: number;
  netSalesUnits: number;
  gpPct: number;
  markdownPct: number;
}

export interface SalesCalendarEvent {
  id: string;
  name: string;
  category: 'festival' | 'sale' | 'marriage' | 'season' | 'national' | 'school' | 'brand';
  start: string;                // YYYY-MM-DD
  end: string;
  liftPercent?: number;
  description?: string;
}

/**
 * Common filter shape — null/undefined fields are omitted in the query string.
 *
 * `brand` and `category` accept a single UUID string OR an array of UUIDs.
 * Arrays get joined as `?brand=A,B,C` in the URL and the backend splits them
 * back into a list. Recommendation engine paths still pass a single string,
 * so its caller contract is unchanged.
 */
export interface SalesFilter {
  brand?: string | string[];
  category?: string | string[];
  band?: string;
  from?: string;                // YYYY-MM inclusive
  to?: string;                  // YYYY-MM inclusive
}

export interface AttributeFilter extends SalesFilter {
  optionType?: 'fabric_type' | 'fit' | 'composition';
}
