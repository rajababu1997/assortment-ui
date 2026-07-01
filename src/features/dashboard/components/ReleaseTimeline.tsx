/**
 * Release Timeline — 12-month horizontal strip showing OTB release
 * progress per month. Each cell colors by dominant state so the buyer
 * sees "Mar is still draft, Apr is locked" at a glance.
 */

import { CalendarRange } from 'lucide-react';
import type { TimelineMonth } from '../useDashboardSections';

interface Props {
  months: TimelineMonth[];
  year: number;
  isLoading: boolean;
}

const STATE_BG: Record<TimelineMonth['state'], string> = {
  final: 'rgba(14,165,233,0.18)',
  released: 'rgba(34,197,94,0.18)',
  in_progress: 'rgba(245,158,11,0.18)',
  planned: 'rgba(96,165,250,0.16)',
  not_started: 'var(--color-surface-alt, #f1f5f9)',
};

const STATE_FG: Record<TimelineMonth['state'], string> = {
  final: '#0369a1',
  released: '#15803d',
  in_progress: '#b45309',
  planned: '#1d4ed8',
  not_started: 'var(--color-text-tertiary)',
};

const STATE_LABEL: Record<TimelineMonth['state'], string> = {
  final: 'Final',
  released: 'Released',
  in_progress: 'In progress',
  planned: 'Planned',
  not_started: 'Not started',
};

export function ReleaseTimeline({ months, year, isLoading }: Props) {
  return (
    <section
      className="rounded-xl border"
      style={{ background: 'var(--color-surface)', borderColor: 'var(--color-divider)' }}
    >
      <header
        className="flex items-center justify-between gap-2 border-b px-3 py-2"
        style={{ borderColor: 'var(--color-divider)' }}
      >
        <div className="flex items-center gap-2">
          <span
            className="flex h-6 w-6 items-center justify-center rounded-md"
            style={{
              background: 'rgba(96,165,250,0.12)',
              color: 'var(--color-primary)',
            }}
          >
            <CalendarRange size={12} />
          </span>
          <h3
            className="text-[12px] font-semibold uppercase tracking-[0.10em]"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Release Timeline — {year}
          </h3>
        </div>
        <Legend />
      </header>

      <div className="overflow-x-auto px-3 py-3">
        <div className="flex min-w-full gap-1.5">
          {isLoading
            ? Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="h-16 flex-1 min-w-[68px] animate-pulse rounded-md"
                  style={{ background: 'var(--color-surface-alt, #f1f5f9)' }}
                />
              ))
            : months.map((m) => (
                <MonthCell key={m.key} m={m} />
              ))}
        </div>
      </div>
    </section>
  );
}

function MonthCell({ m }: { m: TimelineMonth }) {
  return (
    <div
      className="flex flex-1 min-w-[68px] flex-col items-center justify-between rounded-md border px-2 py-1.5"
      style={{
        background: STATE_BG[m.state],
        borderColor: m.state === 'not_started' ? 'var(--color-divider)' : 'transparent',
        color: STATE_FG[m.state],
      }}
      title={`${m.label}: ${STATE_LABEL[m.state]} · ${m.releasedRows}/${m.totalRows} rows released`}
    >
      <div className="text-[11px] font-bold uppercase tracking-wider">{m.label}</div>
      <div className="text-[10px] font-medium leading-tight">{STATE_LABEL[m.state]}</div>
      {m.totalRows > 0 && (
        <div className="text-[10px] tabular-nums opacity-80">
          {m.releasedRows}/{m.totalRows}
        </div>
      )}
    </div>
  );
}

function Legend() {
  const items: TimelineMonth['state'][] = ['final', 'released', 'in_progress', 'planned', 'not_started'];
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      {items.map((s) => (
        <span key={s} className="inline-flex items-center gap-1 text-[10px]"
          style={{ color: 'var(--color-text-tertiary)' }}>
          <span
            className="h-2.5 w-2.5 rounded-sm border"
            style={{
              background: STATE_BG[s],
              borderColor: s === 'not_started' ? 'var(--color-divider)' : 'transparent',
            }}
          />
          {STATE_LABEL[s]}
        </span>
      ))}
    </div>
  );
}
