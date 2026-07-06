/**
 * Month card — one card per calendar month. Shows cross-city averaged
 * highs/lows + season-driven fashion guidance.
 *
 * All numbers are ERA5 historical actuals averaged over 2022–2024.
 */

import { ArrowDown, ArrowUp, CloudRain, Sparkles } from 'lucide-react';
import type { CityMonthClimate } from '../types';
import type { SeasonDef } from '../data/india-seasons';

interface Props {
  month: number;                       // 0..11
  monthName: string;
  season: SeasonDef;
  cities: CityMonthClimate[];          // one entry per city for this month
  isCurrentMonth: boolean;
}

export function MonthCard({ month, monthName, season, cities, isCurrentMonth }: Props) {
  // Sort North → South so the temperature story is visible
  const REGION_ORDER: Record<CityMonthClimate['region'], number> = {
    North: 0, Central: 1, West: 2, East: 3, South: 4,
  };
  const ordered = [...cities].sort((a, b) => {
    const r = REGION_ORDER[a.region] - REGION_ORDER[b.region];
    if (r !== 0) return r;
    return a.cityName.localeCompare(b.cityName);
  });

  const nAvg = avg(cities.map((c) => c.avgTempMax));
  const avgRainyDays = avg(cities.map((c) => c.rainyDays));

  return (
    <article
      className="flex flex-col overflow-hidden rounded-xl border bg-white"
      style={{
        borderColor: isCurrentMonth ? 'rgba(96,165,250,0.55)' : 'var(--color-divider)',
        boxShadow: isCurrentMonth ? '0 0 0 3px rgba(96,165,250,0.10)' : undefined,
      }}
    >
      {/* Header */}
      <header
        className="flex items-center justify-between gap-2 border-b px-3 py-2.5"
        style={{
          borderColor: 'var(--color-divider)',
          background: `linear-gradient(90deg, ${season.tone.bg}, transparent)`,
        }}
      >
        <div>
          <div className="flex items-center gap-1.5">
            <h3
              className="text-[14px] font-bold uppercase tracking-wider"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {monthName}
            </h3>
            {isCurrentMonth && (
              <span
                className="rounded-full px-1.5 py-0 text-[9px] font-bold uppercase tracking-wider"
                style={{ background: 'var(--color-primary)', color: '#fff' }}
              >
                Now
              </span>
            )}
          </div>
          <div className="mt-0.5 text-[10.5px] font-semibold"
            style={{ color: season.tone.fg }}>
            {season.label} season
          </div>
        </div>
        <div className="text-right">
          <div
            className="text-[18px] font-bold tabular-nums leading-none"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {nAvg.toFixed(0)}°
          </div>
          <div
            className="mt-0.5 text-[9px] uppercase tracking-wider"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            avg high
          </div>
        </div>
      </header>

      {/* City temps */}
      <div className="flex flex-col gap-0.5 border-b px-3 py-2"
        style={{ borderColor: 'var(--color-divider)' }}>
        <div
          className="mb-0.5 text-[9px] font-bold uppercase tracking-[0.12em]"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          City averages (high / low · rainy days)
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
          {ordered.map((c) => (
            <div key={c.cityId} className="flex items-baseline justify-between gap-2">
              <span
                className="truncate text-[11px]"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                {c.cityName}
              </span>
              <div className="flex items-baseline gap-1 tabular-nums">
                <span
                  className="text-[11px] font-semibold"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {c.avgTempMax.toFixed(0)}°
                </span>
                <span
                  className="text-[10px]"
                  style={{ color: 'var(--color-text-tertiary)' }}
                >
                  /{c.avgTempMin.toFixed(0)}°
                </span>
                {c.rainyDays >= 3 && (
                  <span
                    className="inline-flex items-center gap-0.5 text-[9.5px] font-medium"
                    style={{ color: '#2563eb' }}
                    title={`~${c.rainyDays.toFixed(0)} rainy days · ${c.totalPrecip.toFixed(0)}mm typical`}
                  >
                    <CloudRain size={9} />
                    {c.rainyDays.toFixed(0)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Buyer guidance — highlighted panel */}
      <div
        className="flex flex-col gap-2 border-t-2 px-3 py-3"
        style={{
          borderColor: season.tone.solid,
          background: `linear-gradient(180deg, ${season.tone.bg} 0%, transparent 100%)`,
        }}
      >
        <div className="flex items-center gap-1.5">
          <Sparkles size={13} style={{ color: season.tone.solid }} />
          <span
            className="text-[11px] font-bold uppercase tracking-[0.10em]"
            style={{ color: season.tone.fg }}
          >
            Buyer guidance
          </span>
          <span
            className="text-[10px] font-semibold"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            · {season.label}
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <GuidanceRow
            icon={<ArrowUp size={11} strokeWidth={3} />}
            label="Boost"
            headerBg="#059669"
            headerFg="#fff"
            chipBg="rgba(16,185,129,0.14)"
            chipBorder="rgba(16,185,129,0.40)"
            chipFg="#065f46"
            items={season.boostCategories.slice(0, 6)}
          />

          {season.reduceCategories.length > 0 && (
            <GuidanceRow
              icon={<ArrowDown size={11} strokeWidth={3} />}
              label="Reduce"
              headerBg="#dc2626"
              headerFg="#fff"
              chipBg="rgba(239,68,68,0.12)"
              chipBorder="rgba(239,68,68,0.35)"
              chipFg="#991b1b"
              items={season.reduceCategories.slice(0, 4)}
            />
          )}
        </div>

        {avgRainyDays >= 8 && (
          <div
            className="mt-0.5 flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10.5px] font-medium"
            style={{
              background: 'rgba(59,130,246,0.10)',
              borderColor: 'rgba(59,130,246,0.30)',
              color: '#1e40af',
            }}
          >
            <CloudRain size={11} />
            <span>Monsoon watch — {avgRainyDays.toFixed(0)} avg rainy days across cities</span>
          </div>
        )}
      </div>
    </article>
  );
}

function avg(xs: number[]): number {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
}

interface GuidanceRowProps {
  icon: React.ReactNode;
  label: 'Boost' | 'Reduce';
  headerBg: string;
  headerFg: string;
  chipBg: string;
  chipBorder: string;
  chipFg: string;
  items: string[];
}

function GuidanceRow({
  icon, label, headerBg, headerFg, chipBg, chipBorder, chipFg, items,
}: GuidanceRowProps) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span
        className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow-sm"
        style={{ background: headerBg, color: headerFg }}
      >
        {icon}
        {label}
      </span>
      {items.map((c) => (
        <span
          key={c}
          className="rounded-full border px-2 py-0.5 text-[11px] font-semibold"
          style={{ background: chipBg, borderColor: chipBorder, color: chipFg }}
        >
          {c}
        </span>
      ))}
    </div>
  );
}
