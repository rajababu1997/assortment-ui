/**
 * Recommendation DTOs — mirror the Kotlin shapes returned by `/recommendation/*`.
 *
 * Same explanation shape across all three recommenders so the UI primitives
 * (ConfidencePill, ExplanationDrawer) work uniformly.
 */

export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'cold_start';

export interface RecommendationDriver {
  label: string;
  observation: string;
  /** Positive = boost (green), negative = penalty (amber), 0 = baseline (neutral). */
  deltaPct: number;
  direction: 'boost' | 'penalty' | 'baseline';
}

export interface RecommendationExplanation {
  summary: string;
  drivers: RecommendationDriver[];
  caveats: string[];
  contextNotes: string[];
  confidence: ConfidenceLevel;
  monthsOfHistory: number;
}

// ── Annual ────────────────────────────────────────────────────────────────

export interface AnnualLySnapshot {
  mrpValueSales: number;
  netSales: number;
  saleVolume: number;
  categoryVolume: number;
  gpPct: number;
  productCost: number;
  markdown: number;
  sellThroughPct: number;
  lyLiftPct: number;
  /** Full LY OTB = netSales + markdown + eom − bom. Preferred over the
   *  `netSales + markdown` approximation for YoY math in the drawer. */
  lyOtb?: number;
}

export interface RecommendedAnnualRow {
  otbRowUuid: string;
  periodKey: string;
  brandUuid: string;
  categoryUuid: string;
  otbCode?: string;
  recommendedOtbAmount: number;
  plannedSales: number;
  markdowns: number;
  eomInventory: number;
  bomInventory: number;
  onOrder: number;
  lySnapshot?: AnnualLySnapshot;
  thisLiftPct?: number;
  activeEventNames?: string[];
  explanation: RecommendationExplanation;
}

export interface AnnualRecommendation {
  planUuid: string;
  overallBudget: number;
  totalRecommended: number;
  planLyTotalOtb?: number;
  growthPctApplied?: number;
  rows: RecommendedAnnualRow[];
  summary: RecommendationExplanation;
}

// ── Value Plan ────────────────────────────────────────────────────────────

export interface ValuePlanBandLySnapshot {
  revenue: number;
  revenueSharePct: number;
  units: number;
  avgMrp: number;
  avgCost: number;
  gpPct: number;
  strPct: number;
  markdownPct: number;
}

export interface ValuePlanBandTySnapshot {
  bandBudget: number;
  budgetPct: number;
  units: number;
  avgMrp: number;
  avgCost: number;
  gpPct: number;
}

export interface ChangeReason {
  type: string;
  text: string;
  deltaPct?: number;
}

export interface RecommendedValuePlanBand {
  bandId: string;
  budgetPct: number;
  avgMrp: number;
  avgCost: number;
  lySnapshot?: ValuePlanBandLySnapshot;
  tySnapshot?: ValuePlanBandTySnapshot;
  reasons?: ChangeReason[];
  explanation: RecommendationExplanation;
}

export interface ValuePlanRecommendation {
  planUuid: string;
  otbCode: string;
  budgetSnapshot: number;
  bands: RecommendedValuePlanBand[];
  summary: RecommendationExplanation;
}

// ── Option Plan ───────────────────────────────────────────────────────────

export interface RecommendedOptionLine {
  optionType: 'fabric_type' | 'fit' | 'composition';
  subTypeKey: string;
  subTypeLabel: string;
  qty: number;
}

export interface OptionSubTypeMix {
  optionType: string;
  subTypeKey: string;
  subTypeLabel: string;
  qty: number;
}

export interface OptionPlanBandLySnapshot {
  optionsActive: number;
  avgPerOption: number;
  totalUnits: number;
  subTypeMix: OptionSubTypeMix[];
}

export interface RecommendedOptionBand {
  bandId: string;
  avgProductionQtyPerOption: number;
  productionQtySnapshot: number;
  optionPlanQty: number;
  lines: RecommendedOptionLine[];
  lySnapshot?: OptionPlanBandLySnapshot;
  reasons?: ChangeReason[];
  explanation: RecommendationExplanation;
}

export interface OptionPlanRecommendation {
  planUuid: string;
  otbCode: string;
  bands: RecommendedOptionBand[];
  summary: RecommendationExplanation;
}
