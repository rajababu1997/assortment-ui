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
  explanation: RecommendationExplanation;
}

export interface AnnualRecommendation {
  planUuid: string;
  overallBudget: number;
  totalRecommended: number;
  rows: RecommendedAnnualRow[];
  summary: RecommendationExplanation;
}

// ── Value Plan ────────────────────────────────────────────────────────────

export interface RecommendedValuePlanBand {
  bandId: string;
  budgetPct: number;
  avgMrp: number;
  avgCost: number;
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

export interface RecommendedOptionBand {
  bandId: string;
  avgProductionQtyPerOption: number;
  productionQtySnapshot: number;
  optionPlanQty: number;
  lines: RecommendedOptionLine[];
  explanation: RecommendationExplanation;
}

export interface OptionPlanRecommendation {
  planUuid: string;
  otbCode: string;
  bands: RecommendedOptionBand[];
  summary: RecommendationExplanation;
}
