/**
 * Calendar API service — mock backed by static JSON files in `public/`.
 *
 * Looks and behaves like a real REST endpoint:
 *   - Real HTTP `fetch()` to `/mock-api/calendar/{country}/{year}.json` —
 *     fully visible in the browser's Network tab as `GET 200` requests.
 *   - Async function returning `Promise<CalendarEvent[]>`.
 *   - 404s mapped to a typed `CalendarApiError` so the UI can render an
 *     error state realistically.
 *
 * ── PROD-SWAP INSTRUCTIONS ───────────────────────────────────────────────
 * When the backend ships, change the `MOCK_API_BASE` constant (or wire to
 * `invokeService` against `API_CONFIG.calendar.events`). The signature,
 * response shape, the React Query hook (`useCalendarEvents`), and every
 * UI consumer stay exactly the same.
 *
 * Reference replacement (uncomment + wire endpoint in apiConfig.ts):
 *
 *   import { invokeService } from '@/services/invokeService';
 *   import { API_CONFIG } from '@/constants/apiConfig';
 *
 *   export async function fetchCalendarEvents(params: FetchCalendarParams) {
 *     return invokeService<CalendarEvent[]>(
 *       API_CONFIG.calendar.events,
 *       { country: params.country, year: params.year,
 *         categories: params.categories?.join(',') },
 *     );
 *   }
 * ─────────────────────────────────────────────────────────────────────────
 */

import type { CalendarEvent, CalendarEventCategory } from './types';

/** Two-letter ISO country code. */
export type CalendarCountry = 'IN' | 'US';

export const SUPPORTED_COUNTRIES: { code: CalendarCountry; label: string; flag: string }[] = [
  { code: 'IN', label: 'India',         flag: '🇮🇳' },
  { code: 'US', label: 'United States', flag: '🇺🇸' },
];

const MOCK_API_BASE = '/mock-api/calendar';

export interface FetchCalendarParams {
  country: CalendarCountry;
  year: number;
  /** Optional category subset (mock filters client-side; real backend
   *  would handle this server-side via query params). */
  categories?: CalendarEventCategory[];
}

export class CalendarApiError extends Error {
  public readonly status: number;
  constructor(message: string, status = 500) {
    super(message);
    this.name = 'CalendarApiError';
    this.status = status;
  }
}

/**
 * Fetch calendar events for a country + year. Issues a real GET request —
 * visible in the Network tab as `GET /mock-api/calendar/IN/2026.json`.
 */
export async function fetchCalendarEvents(
  params: FetchCalendarParams,
): Promise<CalendarEvent[]> {
  const response = await fetch(`${MOCK_API_BASE}/${params.country}/${params.year}.json`, {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new CalendarApiError(
      response.status === 404
        ? `Calendar data for ${params.country} / ${params.year} is not available.`
        : `Failed to load calendar events (HTTP ${response.status}).`,
      response.status,
    );
  }

  const events = (await response.json()) as CalendarEvent[];

  if (!params.categories?.length) {
    return events;
  }
  const allowed = new Set(params.categories);
  return events.filter((e) => allowed.has(e.category));
}

/**
 * Supported years per country — mirrors a real backend's
 * `GET /calendar/{country}/years` metadata endpoint.
 */
export async function fetchCalendarSupportedYears(
  country: CalendarCountry,
): Promise<number[]> {
  const response = await fetch(`${MOCK_API_BASE}/${country}/supported-years.json`, {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) {
    throw new CalendarApiError(
      `Failed to load supported years (HTTP ${response.status}).`,
      response.status,
    );
  }
  return (await response.json()) as number[];
}
