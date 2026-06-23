/**
 * Calendar event model — generic enough to power Fashion Planning,
 * Marketing, or any seasonal-context view. Each event is identified by
 * category so the calendar can color/filter consistently.
 */

export type CalendarEventCategory =
  | 'festival'
  | 'sale'
  | 'marriage'
  | 'season'
  | 'national'
  | 'school'
  | 'brand';

export interface CalendarEvent {
  id: string;
  name: string;
  category: CalendarEventCategory;
  /** ISO YYYY-MM-DD. Single-day events use the same value for start and end. */
  start: string;
  end: string;
  description?: string;
  /** Expected sales lift % over baseline — surfaced in the card so the planner can prioritise. */
  liftPercent?: number;
}
