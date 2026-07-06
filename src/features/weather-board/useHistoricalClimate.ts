/**
 * Fetch 3 years of historical daily weather (2022–2024) for one city from
 * Open-Meteo's Historical Weather API and roll it up into monthly averages.
 *
 * Data source: ERA5 reanalysis by ECMWF (European Centre for Medium-Range
 * Weather Forecasts) — the same dataset used by climate researchers and
 * most consumer weather apps.
 *
 * Cache: 24 h. Historical data is immutable once past — no need to refetch
 * within a day. The queryKey is city+year-window so future adjustments are
 * cheap.
 */

import { useQuery } from '@tanstack/react-query';
import type {
  City,
  CityMonthClimate,
  HistoricalResponse,
} from './types';

const HISTORICAL_BASE = 'https://archive-api.open-meteo.com/v1/archive';
const START_DATE = '2022-01-01';
const END_DATE = '2024-12-31';
const YEARS_COUNT = 3;

async function fetchHistorical(city: City): Promise<HistoricalResponse> {
  const url = new URL(HISTORICAL_BASE);
  url.searchParams.set('latitude', city.latitude.toFixed(3));
  url.searchParams.set('longitude', city.longitude.toFixed(3));
  url.searchParams.set('start_date', START_DATE);
  url.searchParams.set('end_date', END_DATE);
  url.searchParams.set(
    'daily',
    'temperature_2m_max,temperature_2m_min,precipitation_sum',
  );
  url.searchParams.set('timezone', 'Asia/Kolkata');

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Open-Meteo Historical ${res.status} for ${city.id}`);
  return (await res.json()) as HistoricalResponse;
}

/** Roll up daily rows into 12 monthly averages for the city. */
function rollupMonthly(city: City, resp: HistoricalResponse): CityMonthClimate[] {
  const monthly: CityMonthClimate[] = [];
  const time = resp.daily.time;
  const maxT = resp.daily.temperature_2m_max;
  const minT = resp.daily.temperature_2m_min;
  const precip = resp.daily.precipitation_sum;

  interface Bucket { maxSum: number; minSum: number; precipSum: number; count: number; rainy: number; }
  const buckets: Bucket[] = Array.from({ length: 12 }, () => ({
    maxSum: 0, minSum: 0, precipSum: 0, count: 0, rainy: 0,
  }));

  for (let i = 0; i < time.length; i += 1) {
    const m = parseInt(time[i].slice(5, 7), 10) - 1;
    if (m < 0 || m > 11) continue;
    const p = precip[i] ?? 0;
    buckets[m].maxSum += maxT[i] ?? 0;
    buckets[m].minSum += minT[i] ?? 0;
    buckets[m].precipSum += p;
    buckets[m].count += 1;
    if (p >= 2) buckets[m].rainy += 1;
  }

  for (let m = 0; m < 12; m += 1) {
    const b = buckets[m];
    monthly.push({
      cityId: city.id,
      cityName: city.name,
      region: city.region,
      month: m,
      avgTempMax: b.count ? b.maxSum / b.count : 0,
      avgTempMin: b.count ? b.minSum / b.count : 0,
      totalPrecip: b.precipSum / YEARS_COUNT, // avg per-year mm in that month
      rainyDays: b.rainy / YEARS_COUNT,       // avg rainy days per year in that month
      yearsAveraged: YEARS_COUNT,
    });
  }

  return monthly;
}

export function useHistoricalClimate(city: City) {
  return useQuery<CityMonthClimate[]>({
    queryKey: ['weather', 'historical-monthly', city.id, START_DATE, END_DATE],
    queryFn: async () => {
      const resp = await fetchHistorical(city);
      return rollupMonthly(city, resp);
    },
    staleTime: 24 * 60 * 60 * 1000, // 24 h — climate history doesn't change
    gcTime: 7 * 24 * 60 * 60 * 1000, // 1 week
    retry: 1,
  });
}
