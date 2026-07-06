/**
 * Full-year view — 12 month cards grouped by fashion season. Fetches
 * historical actuals for all cities in parallel and cross-references
 * per-month averages into each MonthCard.
 */

import { useMemo } from 'react';
import { useDemoToday } from '@/hooks/useDemoClock';
import { useQueries } from '@tanstack/react-query';
import { INDIA_CITIES } from '../data/india-cities';
import { INDIA_SEASONS, seasonForMonth, type SeasonDef } from '../data/india-seasons';
import type { CityMonthClimate } from '../types';
import { MonthCard } from './MonthCard';

const HISTORICAL_BASE = 'https://archive-api.open-meteo.com/v1/archive';
const START_DATE = '2022-01-01';
const END_DATE = '2024-12-31';
const YEARS_COUNT = 3;

const MONTH_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function YearView() {
  const todayMs = useDemoToday();
  const currentMonth = new Date(todayMs).getMonth();

  // Fetch all cities in parallel via useQueries; a single hook per city so
  // React Query dedupes and caches independently.
  const queries = useQueries({
    queries: INDIA_CITIES.map((city) => ({
      queryKey: ['weather', 'historical-monthly', city.id, START_DATE, END_DATE],
      queryFn: async () => {
        const url = new URL(HISTORICAL_BASE);
        url.searchParams.set('latitude', city.latitude.toFixed(3));
        url.searchParams.set('longitude', city.longitude.toFixed(3));
        url.searchParams.set('start_date', START_DATE);
        url.searchParams.set('end_date', END_DATE);
        url.searchParams.set('daily', 'temperature_2m_max,temperature_2m_min,precipitation_sum');
        url.searchParams.set('timezone', 'Asia/Kolkata');
        const res = await fetch(url.toString());
        if (!res.ok) throw new Error(`Open-Meteo Historical ${res.status}`);
        const json = await res.json();

        interface Bucket { maxSum: number; minSum: number; precipSum: number; count: number; rainy: number; }
        const buckets: Bucket[] = Array.from({ length: 12 }, () => ({
          maxSum: 0, minSum: 0, precipSum: 0, count: 0, rainy: 0,
        }));
        const times: string[] = json.daily.time;
        for (let i = 0; i < times.length; i += 1) {
          const m = parseInt(times[i].slice(5, 7), 10) - 1;
          if (m < 0 || m > 11) continue;
          const p: number = json.daily.precipitation_sum[i] ?? 0;
          buckets[m].maxSum += json.daily.temperature_2m_max[i] ?? 0;
          buckets[m].minSum += json.daily.temperature_2m_min[i] ?? 0;
          buckets[m].precipSum += p;
          buckets[m].count += 1;
          if (p >= 2) buckets[m].rainy += 1;
        }
        const out: CityMonthClimate[] = [];
        for (let m = 0; m < 12; m += 1) {
          const b = buckets[m];
          out.push({
            cityId: city.id,
            cityName: city.name,
            region: city.region,
            month: m,
            avgTempMax: b.count ? b.maxSum / b.count : 0,
            avgTempMin: b.count ? b.minSum / b.count : 0,
            totalPrecip: b.precipSum / YEARS_COUNT,
            rainyDays: b.rainy / YEARS_COUNT,
            yearsAveraged: YEARS_COUNT,
          });
        }
        return out;
      },
      staleTime: 24 * 60 * 60 * 1000,
      gcTime: 7 * 24 * 60 * 60 * 1000,
      retry: 1,
    })),
  });

  // Build a { month → CityMonthClimate[] } index from whatever cities have
  // resolved so far. Partial data still renders — one slow city doesn't
  // block the page.
  const monthIndex = useMemo(() => {
    const idx: Record<number, CityMonthClimate[]> = {};
    for (let m = 0; m < 12; m += 1) idx[m] = [];
    queries.forEach((q) => {
      if (!q.data) return;
      q.data.forEach((row) => {
        idx[row.month].push(row);
      });
    });
    return idx;
  }, [queries]);

  const anyLoading = queries.some((q) => q.isLoading);
  const readyCount = queries.filter((q) => q.data).length;

  return (
    <div className="flex flex-col gap-4">
      <LoadingBar readyCount={readyCount} totalCount={INDIA_CITIES.length} showing={anyLoading} />

      {INDIA_SEASONS.map((season) => (
        <SeasonBlock
          key={season.id}
          season={season}
          monthIndex={monthIndex}
          currentMonth={currentMonth}
        />
      ))}

      <SourceNote />
    </div>
  );
}

// ── Season block ───────────────────────────────────────────────────────────

function SeasonBlock({
  season, monthIndex, currentMonth,
}: {
  season: SeasonDef;
  monthIndex: Record<number, CityMonthClimate[]>;
  currentMonth: number;
}) {
  return (
    <section
      className="rounded-2xl border p-3"
      style={{
        borderColor: season.tone.border,
        background: `linear-gradient(180deg, ${season.tone.bg} 0%, transparent 40%)`,
      }}
    >
      <header className="mb-3 flex flex-wrap items-baseline justify-between gap-3">
        <div className="flex flex-wrap items-baseline gap-2">
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em]"
            style={{ background: season.tone.solid, color: '#fff' }}
          >
            {season.label}
          </span>
          <span
            className="text-[11px] tabular-nums"
            style={{ color: season.tone.fg }}
          >
            {season.months.map((m) => MONTH_LONG[m].slice(0, 3)).join(' · ')}
          </span>
          <span
            className="text-[11px]"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            · {season.imdLabel}
          </span>
        </div>
        <div
          className="text-[11px] font-medium"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {season.weather}
        </div>
      </header>

      <p
        className="mb-3 text-[11.5px]"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        <strong style={{ color: 'var(--color-text-primary)' }}>Fashion focus:</strong> {season.fashionFocus}
      </p>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {season.months.map((m) => (
          <MonthCard
            key={m}
            month={m}
            monthName={MONTH_LONG[m]}
            season={seasonForMonth(m)}
            cities={monthIndex[m] ?? []}
            isCurrentMonth={m === currentMonth}
          />
        ))}
      </div>
    </section>
  );
}

// ── Small helpers ──────────────────────────────────────────────────────────

function LoadingBar({
  readyCount, totalCount, showing,
}: {
  readyCount: number; totalCount: number; showing: boolean;
}) {
  if (!showing) return null;
  const pct = totalCount ? Math.round((readyCount / totalCount) * 100) : 0;
  return (
    <div
      className="flex items-center gap-2 rounded-lg border px-3 py-2 text-[11px]"
      style={{
        background: 'rgba(96,165,250,0.06)',
        borderColor: 'rgba(96,165,250,0.30)',
        color: 'var(--color-text-secondary)',
      }}
    >
      <span
        className="h-2 w-2 animate-pulse rounded-full"
        style={{ background: 'var(--color-primary)' }}
      />
      Loading 3-year historical average for {readyCount} of {totalCount} cities ({pct}%)…
    </div>
  );
}

function SourceNote() {
  return (
    <div
      className="rounded-lg border px-3 py-2 text-[11px]"
      style={{
        background: 'rgba(96,165,250,0.06)',
        borderColor: 'rgba(96,165,250,0.30)',
        color: 'var(--color-text-secondary)',
      }}
    >
      <strong>Data source:</strong> Historical daily weather for {START_DATE} → {END_DATE} from{' '}
      <a
        href="https://open-meteo.com/en/docs/historical-weather-api"
        target="_blank"
        rel="noreferrer"
        className="underline"
        style={{ color: 'var(--color-primary)' }}
      >
        Open-Meteo Historical API
      </a>{' '}
      (ERA5 reanalysis by ECMWF · CC-BY 4.0). Temperatures and precipitation on each card are
      real observations averaged across 3 years. Season boundaries follow the{' '}
      <a
        href="https://mausam.imd.gov.in/"
        target="_blank"
        rel="noreferrer"
        className="underline"
        style={{ color: 'var(--color-primary)' }}
      >
        Indian Meteorological Department
      </a>{' '}
      classification. Category boost/reduce chips are analyst-derived from the season profile.
    </div>
  );
}
