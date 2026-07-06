/**
 * One city card. Owns the fetch + aggregation + impact derivation for its
 * city so the page component stays declarative.
 */

import { AlertCircle, MapPin } from 'lucide-react';
import { useMemo } from 'react';
import type { City } from '../types';
import { useWeatherForecast } from '../useWeatherForecast';
import {
  PRECIP_ZONE_TONE,
  TEMP_ZONE_TONE,
  aggregate,
  deriveImpact,
  precipZoneLabel,
  shortDate,
  tempZoneLabel,
  zipDaily,
} from '../utils';
import { CategoryImpact } from './CategoryImpact';
import { ForecastStrip } from './ForecastStrip';

interface Props {
  city: City;
}

export function CityCard({ city }: Props) {
  const { data, isLoading, isError } = useWeatherForecast(city);

  const derived = useMemo(() => {
    if (!data) return null;
    const days = zipDaily(data.daily);
    const agg = aggregate(days);
    const impact = deriveImpact(agg);
    return { days, agg, impact };
  }, [data]);

  return (
    <article
      className="flex flex-col overflow-hidden rounded-xl border bg-white"
      style={{ borderColor: 'var(--color-divider)' }}
    >
      {/* Header */}
      <header
        className="flex flex-col gap-2 border-b px-4 py-3"
        style={{
          borderColor: 'var(--color-divider)',
          background: 'linear-gradient(90deg, rgba(96,165,250,0.10), rgba(167,139,250,0.04))',
        }}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <MapPin size={13} style={{ color: 'var(--color-primary)' }} />
              <h3
                className="truncate text-[14px] font-semibold leading-tight"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {city.name}
              </h3>
            </div>
            <div
              className="mt-0.5 text-[11px]"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              {city.state} · {city.region} India
            </div>
          </div>

          {derived && (
            <div className="flex flex-col items-end">
              <div
                className="text-[20px] font-bold tabular-nums leading-none"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {Math.round(derived.agg.avgTempMax)}°
              </div>
              <div
                className="text-[10.5px] tabular-nums"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                avg high · 14d
              </div>
            </div>
          )}
        </div>

        {derived && (
          <div className="flex flex-wrap items-center gap-1">
            <Pill tone={TEMP_ZONE_TONE[derived.agg.tempZone]}>
              {tempZoneLabel(derived.agg.tempZone)}
            </Pill>
            <Pill tone={PRECIP_ZONE_TONE[derived.agg.precipZone]}>
              {precipZoneLabel(derived.agg.precipZone)}
            </Pill>
            <span
              className="text-[10.5px] tabular-nums"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              · lows {Math.round(derived.agg.avgTempMin)}° · {derived.agg.rainyDays} rainy days
            </span>
          </div>
        )}
      </header>

      {/* Body */}
      <div className="flex flex-col gap-3 px-4 py-3">
        {isLoading ? (
          <SkeletonRow />
        ) : isError || !derived ? (
          <ErrorRow />
        ) : (
          <>
            {/* 14-day strip */}
            <div>
              <div
                className="mb-1.5 text-[9px] font-bold uppercase tracking-[0.12em]"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                Next 14 days · {shortDate(derived.days[0].date)} → {shortDate(derived.days[derived.days.length - 1].date)}
              </div>
              <ForecastStrip days={derived.days} />
            </div>

            <CategoryImpact items={derived.impact} />
          </>
        )}
      </div>
    </article>
  );
}

function Pill({ tone, children }: { tone: { bg: string; fg: string; border: string }; children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10.5px] font-semibold"
      style={{ background: tone.bg, color: tone.fg, borderColor: tone.border }}
    >
      {children}
    </span>
  );
}

function SkeletonRow() {
  return (
    <>
      <div className="h-14 animate-pulse rounded-md" style={{ background: 'var(--color-surface-alt, #f1f5f9)' }} />
      <div className="h-12 animate-pulse rounded-md" style={{ background: 'var(--color-surface-alt, #f1f5f9)' }} />
    </>
  );
}

function ErrorRow() {
  return (
    <div
      className="flex items-start gap-2 rounded-md border px-3 py-2 text-[11.5px]"
      style={{
        background: 'rgba(239,68,68,0.06)',
        borderColor: 'rgba(239,68,68,0.28)',
        color: '#b91c1c',
      }}
    >
      <AlertCircle size={13} className="mt-[2px] shrink-0" />
      <div>
        Couldn't load the forecast for this city. Open-Meteo may be unavailable — try refresh.
      </div>
    </div>
  );
}
