/**
 * Demand Calendar — India 2026 verifiable calendar events, presented as a
 * signal cockpit for merchandisers. Mounted at `/demand-calendar`.
 *
 * Data source: `src/data/india-signals-2026.json`. Every card physically
 * separates two rails:
 *   1. Source-backed facts (event, date, region, source URL)
 *   2. Merchandiser guidance (analyst's planning action + reasoning)
 *
 * No numerical sales-uplift is claimed anywhere. No third-party publisher
 * confidence is invented. No copyrighted marks/artwork are used.
 */

import { useMemo, useState } from 'react';
import { CalendarClock, ChevronDown, Filter, Inbox, Plus } from 'lucide-react';
import dataset from '@/data/india-signals-2026.json';
import type { Signal, SignalCategory, SignalsDataset } from './types';
import { anchorMonth, monthName } from './utils';
import { FilterBar, type CalendarFilters } from './components/FilterBar';
import { MonthGroup } from './components/MonthGroup';
import { AddEventDialog } from './components/AddEventDialog';
import { useUserEvents } from './userEventsStore';

const DATA = dataset as unknown as SignalsDataset;

export default function DemandCalendarPage() {
  const [filters, setFilters] = useState<CalendarFilters>({
    categories: new Set(),
    months: new Set(),
  });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const { events: userEvents, add: addUserEvent, remove: removeUserEvent } = useUserEvents();

  const allSignals = useMemo(
    () => [...DATA.signals, ...userEvents],
    [userEvents],
  );
  const activeFilterCount = filters.categories.size + filters.months.size;

  // Available filter values — derived from the full dataset once.
  const availableCategories = useMemo(
    () => {
      const s = new Set<SignalCategory>();
      allSignals.forEach((sig) => s.add(sig.signalCategory));
      return Array.from(s).sort();
    },
    [allSignals],
  );

  const availableMonths = useMemo(
    () => {
      const s = new Set<number>();
      allSignals.forEach((sig) => s.add(anchorMonth(sig)));
      return Array.from(s).sort((a, b) => a - b);
    },
    [allSignals],
  );

  // Apply filters (set-based; empty set = "no restriction").
  const filtered = useMemo(() => {
    return allSignals.filter((s) => {
      if (filters.categories.size > 0 && !filters.categories.has(s.signalCategory)) return false;
      if (filters.months.size > 0 && !filters.months.has(anchorMonth(s))) return false;
      return true;
    });
  }, [allSignals, filters]);

  // Group filtered signals by anchor month, sorted chronologically.
  const grouped = useMemo(() => {
    const map = new Map<number, Signal[]>();
    filtered.forEach((s) => {
      const m = anchorMonth(s);
      const arr = map.get(m) ?? [];
      arr.push(s);
      map.set(m, arr);
    });
    // Sort inside each month by anchor date.
    for (const arr of map.values()) {
      arr.sort((a, b) => (a.date ?? a.period?.start ?? '').localeCompare(b.date ?? b.period?.start ?? ''));
    }
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  }, [filtered]);

  return (
    <div className="flex h-full w-full flex-col p-1">
      <div
        className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border shadow-sm"
        style={{ background: 'var(--color-surface)', borderColor: 'var(--color-divider)' }}
      >
        <Header
          totalCount={allSignals.length}
          shownCount={filtered.length}
          asOf={DATA.dataset.asOfDate}
          activeFilterCount={activeFilterCount}
          filtersOpen={filtersOpen}
          onToggleFilters={() => setFiltersOpen((v) => !v)}
          onAddEvent={() => setAddOpen(true)}
        />

        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-3">
          {filtersOpen && (
            <FilterBar
              filters={filters}
              setFilters={setFilters}
              availableCategories={availableCategories}
              availableMonths={availableMonths}
              onClose={() => setFiltersOpen(false)}
            />
          )}

          {grouped.length === 0 ? (
            <EmptyState
              onReset={() => setFilters({
                categories: new Set(), months: new Set(),
              })}
            />
          ) : (
            <div className="flex flex-col gap-4">
              {grouped.map(([monthIdx, signals]) => (
                <MonthGroup
                  key={monthIdx}
                  monthIdx={monthIdx}
                  signals={signals}
                  onDelete={removeUserEvent}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <AddEventDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSave={addUserEvent}
      />
    </div>
  );
}

function Header({
  totalCount, shownCount, asOf, activeFilterCount, filtersOpen, onToggleFilters, onAddEvent,
}: {
  totalCount: number;
  shownCount: number;
  asOf: string;
  activeFilterCount: number;
  filtersOpen: boolean;
  onToggleFilters: () => void;
  onAddEvent: () => void;
}) {
  const filtered = shownCount !== totalCount;
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
        <CalendarClock size={14} strokeWidth={2} />
      </span>
      <div className="min-w-0 flex-1">
        <h1
          className="text-base font-semibold leading-tight"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Demand Calendar — India 2026
        </h1>
        <p
          className="mt-0.5 text-xs"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          {filtered ? `${shownCount} of ${totalCount}` : totalCount} verified calendar events · As of {asOf}
        </p>
      </div>

      <button
        type="button"
        onClick={onAddEvent}
        aria-label="Add new event"
        title="Add new event"
        className="inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-[11.5px] font-semibold transition-colors"
        style={{
          background: 'var(--color-primary)',
          color: '#fff',
        }}
      >
        <Plus size={13} />
        New event
      </button>

      <button
        type="button"
        onClick={onToggleFilters}
        aria-expanded={filtersOpen}
        aria-label={filtersOpen ? 'Hide filters' : 'Show filters'}
        title={filtersOpen ? 'Hide filters' : 'Show filters'}
        className="relative inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-[11.5px] font-medium transition-colors"
        style={{
          borderColor: filtersOpen || activeFilterCount > 0 ? 'rgba(96,165,250,0.45)' : 'var(--color-divider)',
          color: filtersOpen || activeFilterCount > 0 ? 'var(--color-primary)' : 'var(--color-text-secondary)',
          background: filtersOpen
            ? 'color-mix(in srgb, var(--color-primary) 10%, transparent)'
            : 'var(--color-surface)',
        }}
      >
        <Filter size={13} />
        Filters
        {activeFilterCount > 0 && (
          <span
            className="flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-bold tabular-nums"
            style={{ background: 'var(--color-primary)', color: '#fff' }}
          >
            {activeFilterCount}
          </span>
        )}
        <ChevronDown
          size={12}
          style={{
            transition: 'transform 150ms',
            transform: filtersOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </button>
    </div>
  );
}

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-2 rounded-xl border px-6 py-14 text-center"
      style={{
        background: 'var(--color-surface)',
        borderColor: 'var(--color-divider)',
      }}
    >
      <span
        className="flex h-12 w-12 items-center justify-center rounded-full"
        style={{
          background: 'var(--color-surface-alt, #f1f5f9)',
          color: 'var(--color-text-tertiary)',
        }}
      >
        <Inbox size={22} />
      </span>
      <h3
        className="text-sm font-semibold"
        style={{ color: 'var(--color-text-primary)' }}
      >
        No signals match the current filters
      </h3>
      <p
        className="max-w-md text-[12px]"
        style={{ color: 'var(--color-text-tertiary)' }}
      >
        Loosen the filters — or reset to see all 46 verified 2026 events.
      </p>
      <button
        type="button"
        onClick={onReset}
        className="mt-1 rounded-md border px-3 py-1.5 text-[11.5px] font-medium"
        style={{
          borderColor: 'var(--color-divider)',
          color: 'var(--color-primary)',
          background: 'var(--color-surface)',
        }}
      >
        Reset filters
      </button>
      <p className="mt-2 text-[10px]" style={{ color: 'var(--color-text-tertiary)' }}>
        {monthName(0)} → {monthName(11)}
      </p>
    </div>
  );
}
