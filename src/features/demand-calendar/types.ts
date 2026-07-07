/**
 * TypeScript shape of `india-signals-2026.json`. Kept intentionally
 * permissive — the JSON is hand-authored and some optional fields (period,
 * secondaryCategories) may or may not be present per signal.
 */

export type DateConfidence = 'HIGH' | 'MEDIUM_ANNOUNCED' | 'LUNAR_VERIFY';

export type SignalCategory =
  | 'NATIONAL_HOLIDAY'
  | 'NATIONAL_OBSERVANCE'
  | 'HINDU_FESTIVAL'
  | 'MUSLIM_FESTIVAL'
  | 'CHRISTIAN_FESTIVAL'
  | 'SIKH_FESTIVAL'
  | 'REGIONAL_FESTIVAL'
  | 'SPORTS_EVENT'
  | 'ENTERTAINMENT_RELEASE'
  | 'SCHOOL_CALENDAR'
  | 'SEASONAL_WINDOW'
  | 'RETAIL_PROMO_WINDOW'
  | 'END_OF_SEASON_SALE';

export type ActionKey =
  | 'REVIEW_HISTORICAL'
  | 'WATCH'
  | 'TEST'
  | 'PROMO_PLANNING'
  | 'MARKDOWN_PLANNING';

export interface SourceCitation {
  name: string;
  url?: string;
  note?: string;
}

export interface PlanningRelevance {
  primaryCategory: string;
  secondaryCategories?: string[];
  planningReviewStart: string;
  stockLandBy: string;
  action: ActionKey | string;
  reasoning: string;
}

export interface Signal {
  id: string;
  title: string;
  date?: string;                  // YYYY-MM-DD for single-day signals
  period?: { start: string; end: string };
  signalCategory: SignalCategory;
  dateConfidence: DateConfidence;
  dateType: string;
  coverageRegions: string[];
  sourceCitation: SourceCitation;
  planningRelevance: PlanningRelevance;
  /** True when this signal was created by the user via the "Add event" dialog. */
  isUserCreated?: boolean;
  /** Epoch ms — set when the user saves the signal. */
  createdAt?: number;
}

export interface SourceRef {
  id: string;
  name: string;
  url: string | null;
  type: string;
  citationSafe: boolean;
  notes: string;
}

export interface SignalsDataset {
  dataset: {
    name: string;
    market: string;
    asOfDate: string;
    version: string;
    scope: string;
    methodology: Record<string, unknown>;
  };
  signals: Signal[];
  sources: SourceRef[];
  usageGuidelines: Record<string, unknown>;
}
