/**
 * Fetch the 14-day daily forecast for one city from Open-Meteo. Free
 * endpoint, no API key, CORS-enabled — we call it directly from the
 * browser via `fetch`, no backend proxy needed.
 *
 * Cache: 30 min. Forecasts don't change often; hitting the API on every
 * navigation would be wasteful.
 */

import { useQuery } from '@tanstack/react-query';
import type { City, OpenMeteoResponse } from './types';

const BASE = 'https://api.open-meteo.com/v1/forecast';
const DAILY_VARS = [
  'temperature_2m_max',
  'temperature_2m_min',
  'precipitation_sum',
  'precipitation_probability_max',
  'weather_code',
].join(',');

async function fetchForecast(city: City): Promise<OpenMeteoResponse> {
  const url = new URL(BASE);
  url.searchParams.set('latitude', city.latitude.toFixed(3));
  url.searchParams.set('longitude', city.longitude.toFixed(3));
  url.searchParams.set('daily', DAILY_VARS);
  url.searchParams.set('timezone', 'Asia/Kolkata');
  url.searchParams.set('forecast_days', '14');

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Open-Meteo ${res.status} for ${city.id}`);
  return (await res.json()) as OpenMeteoResponse;
}

export function useWeatherForecast(city: City) {
  return useQuery<OpenMeteoResponse>({
    queryKey: ['weather', 'open-meteo', city.id],
    queryFn: () => fetchForecast(city),
    staleTime: 30 * 60 * 1000, // 30 min
    gcTime: 60 * 60 * 1000,    // 1 h
    retry: 1,
  });
}
