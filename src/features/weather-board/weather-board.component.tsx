/**
 * Weather & Climate Board — India · 2026 planning.
 *
 * Two views, toggled from the header:
 *
 *   Year view (default)  — 12 month cards grouped into 4 India-fashion
 *                          seasons (Winter · Summer · Monsoon · Festive),
 *                          each averaging 3 years of ERA5 historical
 *                          actuals across our 12 metros.
 *
 *   Live 14-day forecast — Per-city cards with the next-14-day strip and
 *                          near-term category impact. Handy for reactive
 *                          buying decisions.
 *
 * Both views use Open-Meteo (free, CORS-enabled) and clearly separate
 * source-backed facts from analyst-derived buyer guidance.
 */

import { useMemo, useState } from 'react';
import { CalendarRange, Cloud, Filter, RefreshCw } from 'lucide-react';
import { useQueryClient, useIsFetching } from '@tanstack/react-query';
import { INDIA_CITIES } from './data/india-cities';
import { CityCard } from './components/CityCard';
import { YearView } from './components/YearView';
import type { City } from './types';

type RegionFilter = 'All' | City['region'];
type ViewMode = 'year' | 'live';

const REGIONS: RegionFilter[] = ['All', 'North', 'South', 'East', 'West', 'Central'];

export default function WeatherBoardPage() {
  const [view, setView] = useState<ViewMode>('year');
  const [region, setRegion] = useState<RegionFilter>('All');

  const queryClient = useQueryClient();
  const inFlight = useIsFetching({ queryKey: ['weather'] });
  const refreshing = inFlight > 0;

  const liveCities = useMemo(
    () => region === 'All' ? INDIA_CITIES : INDIA_CITIES.filter((c) => c.region === region),
    [region],
  );

  const refreshAll = () => {
    queryClient.invalidateQueries({ queryKey: ['weather'] });
  };

  return (
    <div className="flex h-full w-full flex-col p-1">
      <div
        className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border shadow-sm"
        style={{ background: 'var(--color-surface)', borderColor: 'var(--color-divider)' }}
      >
        <Header
          view={view}
          onChangeView={setView}
          liveShown={liveCities.length}
          liveTotal={INDIA_CITIES.length}
          onRefresh={refreshAll}
          refreshing={refreshing}
        />

        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-3">
          {view === 'year' ? (
            <YearView />
          ) : (
            <>
              <RegionFilters value={region} onChange={setRegion} />
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 2xl:grid-cols-3">
                {liveCities.map((c) => (
                  <CityCard key={c.id} city={c} />
                ))}
              </div>
              <LiveSourceNote />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Header ────────────────────────────────────────────────────────────────

function Header({
  view, onChangeView, liveShown, liveTotal, onRefresh, refreshing,
}: {
  view: ViewMode;
  onChangeView: (v: ViewMode) => void;
  liveShown: number;
  liveTotal: number;
  onRefresh: () => void;
  refreshing: boolean;
}) {
  return (
    <div
      className="flex flex-wrap items-center gap-3 border-b px-4 py-2.5"
      style={{ borderColor: 'var(--color-divider)' }}
    >
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
        style={{
          background: 'linear-gradient(135deg, rgba(96,165,250,0.20), rgba(167,139,250,0.20))',
          border: '1px solid rgba(96,165,250,0.25)',
          color: 'var(--color-primary)',
        }}
      >
        <Cloud size={14} strokeWidth={2} />
      </span>
      <div className="min-w-0 flex-1">
        <h1
          className="text-base font-semibold leading-tight"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Weather &amp; Climate Board — India
        </h1>
        <p
          className="mt-0.5 text-xs"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          {view === 'year'
            ? '12-month typical weather · Season-grouped · Open-Meteo Historical (ERA5)'
            : `${liveShown === liveTotal ? liveShown : `${liveShown} of ${liveTotal}`} cities · 14-day forecast · Open-Meteo`}
        </p>
      </div>

      <ViewToggle value={view} onChange={onChangeView} />

      <button
        type="button"
        onClick={onRefresh}
        disabled={refreshing}
        className="inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-[11.5px] font-medium transition-colors hover:bg-[var(--color-surface-alt,#f8fafc)] disabled:opacity-60"
        style={{
          borderColor: 'var(--color-divider)',
          color: 'var(--color-text-secondary)',
          background: 'var(--color-surface)',
        }}
      >
        <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
        {refreshing ? 'Refreshing…' : 'Refresh'}
      </button>
    </div>
  );
}

function ViewToggle({ value, onChange }: { value: ViewMode; onChange: (v: ViewMode) => void }) {
  return (
    <div
      className="inline-flex overflow-hidden rounded-md border"
      style={{ borderColor: 'var(--color-divider)' }}
    >
      <ToggleBtn
        active={value === 'year'}
        onClick={() => onChange('year')}
        icon={<CalendarRange size={12} />}
        label="Year view"
      />
      <ToggleBtn
        active={value === 'live'}
        onClick={() => onChange('live')}
        icon={<Cloud size={12} />}
        label="Live 14-day"
      />
    </div>
  );
}

function ToggleBtn({
  active, onClick, icon, label,
}: {
  active: boolean; onClick: () => void; icon: React.ReactNode; label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11.5px] font-medium transition-colors"
      style={{
        background: active
          ? 'color-mix(in srgb, var(--color-primary) 12%, transparent)'
          : 'var(--color-surface)',
        color: active ? 'var(--color-primary)' : 'var(--color-text-secondary)',
      }}
    >
      {icon}
      {label}
    </button>
  );
}

// ── Region filter (live view only) ────────────────────────────────────────

function RegionFilters({
  value, onChange,
}: {
  value: RegionFilter;
  onChange: (r: RegionFilter) => void;
}) {
  return (
    <div
      className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2"
      style={{ borderColor: 'var(--color-divider)' }}
    >
      <Filter size={12} style={{ color: 'var(--color-text-tertiary)' }} />
      <span
        className="text-[10.5px] font-bold uppercase tracking-[0.10em]"
        style={{ color: 'var(--color-text-tertiary)' }}
      >
        Region
      </span>
      <div className="flex flex-wrap gap-1">
        {REGIONS.map((r) => {
          const active = r === value;
          return (
            <button
              key={r}
              type="button"
              onClick={() => onChange(r)}
              className="rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-colors"
              style={{
                background: active
                  ? 'color-mix(in srgb, var(--color-primary) 12%, transparent)'
                  : 'var(--color-surface)',
                borderColor: active ? 'rgba(96,165,250,0.35)' : 'var(--color-divider)',
                color: active ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              }}
            >
              {r}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function LiveSourceNote() {
  return (
    <div
      className="rounded-lg border px-3 py-2 text-[11px]"
      style={{
        background: 'rgba(96,165,250,0.06)',
        borderColor: 'rgba(96,165,250,0.30)',
        color: 'var(--color-text-secondary)',
      }}
    >
      <strong>Data source:</strong> Live 14-day forecast from{' '}
      <a
        href="https://open-meteo.com/"
        target="_blank"
        rel="noreferrer"
        className="underline"
        style={{ color: 'var(--color-primary)' }}
      >
        Open-Meteo
      </a>{' '}
      (aggregates DWD ICON · NOAA GFS · ECMWF IFS · MeteoFrance ARPEGE · CC-BY 4.0). Temperature
      and precipitation numbers come directly from the API. The <em>category impact</em> chips
      are analyst-derived from the aggregate window — hover any chip to see the reason. No
      sales-uplift percentage is claimed.
    </div>
  );
}
