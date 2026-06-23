/**
 * React Query hooks for the calendar API.
 *
 * UI components consume these — they never import the raw API functions
 * directly. When the backend swaps in, only `calendarApi.ts` changes;
 * these hooks stay identical.
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import {
  fetchCalendarEvents,
  fetchCalendarSupportedYears,
  type CalendarCountry,
  type FetchCalendarParams,
} from './calendarApi';
import type { CalendarEvent, CalendarEventCategory } from './types';

export const calendarQueryKeys = {
  all: ['calendar'] as const,
  events: (country: CalendarCountry, year: number, categories?: CalendarEventCategory[]) =>
    ['calendar', 'events', country, year, categories ?? null] as const,
  supportedYears: (country: CalendarCountry) =>
    ['calendar', 'supported-years', country] as const,
};

const FIVE_MINUTES = 5 * 60 * 1000;

export function useCalendarEvents(
  params: FetchCalendarParams,
): UseQueryResult<CalendarEvent[], Error> {
  return useQuery({
    queryKey: calendarQueryKeys.events(params.country, params.year, params.categories),
    queryFn: () => fetchCalendarEvents(params),
    staleTime: FIVE_MINUTES,
    retry: 1,
  });
}

export function useCalendarSupportedYears(
  country: CalendarCountry,
): UseQueryResult<number[], Error> {
  return useQuery({
    queryKey: calendarQueryKeys.supportedYears(country),
    queryFn: () => fetchCalendarSupportedYears(country),
    staleTime: Infinity,
  });
}
