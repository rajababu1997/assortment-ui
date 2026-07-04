/**
 * Aging chart — donut showing distribution of WIP items by how long
 * they've been idle. Stuck buckets (3-7d, >7d) are rendered in warm tones
 * so the buyer's eye is pulled to them immediately.
 */

import { Clock } from 'lucide-react';
import type { AgingBucket } from '../useDashboardKpis';

interface Props {
  buckets: AgingBucket[];
  isLoading: boolean;
}

const BUCKET_COLOR: Record<AgingBucket['key'], string> = {
  '0-1': '#22c55e',
  '1-3': '#84cc16',
  '3-7': '#f59e0b',
  '7+':  '#ef4444',
};

export function AgingChart({ buckets, isLoading }: Props) {
  const total = buckets.reduce((s, b) => s + b.count, 0);

  return (
    <section
      className="rounded-xl border"
      style={{ background: 'var(--color-surface)', borderColor: 'var(--color-divider)' }}
    >
      <header
        className="flex items-center gap-2 rounded-t-xl border-b px-3 py-2"
        style={{
          borderColor: 'var(--color-divider)',
          background: 'linear-gradient(90deg, rgba(96,165,250,0.12), rgba(167,139,250,0.06))',
        }}
      >
        <span
          className="flex h-6 w-6 items-center justify-center rounded-md"
          style={{
            background: 'rgba(245,158,11,0.14)',
            color: '#b45309',
          }}
        >
          <Clock size={12} />
        </span>
        <h3
          className="text-[12px] font-semibold uppercase tracking-[0.10em]"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Aging
        </h3>
      </header>

      <div className="flex items-center gap-4 px-3 py-3">
        {/* Donut */}
        <div className="relative h-[112px] w-[112px] shrink-0">
          {isLoading ? (
            <div
              className="h-full w-full animate-pulse rounded-full"
              style={{ background: 'var(--color-surface-alt, #f1f5f9)' }}
            />
          ) : total === 0 ? (
            <EmptyDonut total={0} />
          ) : (
            <Donut buckets={buckets} total={total} />
          )}
        </div>

        {/* Legend */}
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          {buckets.map((b) => {
            const pct = total > 0 ? Math.round((b.count / total) * 100) : 0;
            return (
              <div key={b.key} className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-sm"
                  style={{ background: BUCKET_COLOR[b.key] }}
                />
                <span
                  className="flex-1 truncate text-[11.5px]"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  {b.label}
                </span>
                <span
                  className="shrink-0 text-[11.5px] font-semibold tabular-nums"
                  style={{
                    color: b.stuck && b.count > 0
                      ? '#b45309'
                      : 'var(--color-text-primary)',
                  }}
                >
                  {b.count}
                  <span
                    className="ml-1 text-[10px] font-normal"
                    style={{ color: 'var(--color-text-tertiary)' }}
                  >
                    ({pct}%)
                  </span>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

interface DonutProps {
  buckets: AgingBucket[];
  total: number;
}

function Donut({ buckets, total }: DonutProps) {
  const size = 112;
  const strokeW = 18;
  const r = (size - strokeW) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;

  // Compute cumulative offsets so each arc segment sits next to the previous.
  let assigned = 0;
  return (
    <>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: 'rotate(-90deg)' }}
      >
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="var(--color-surface-alt, #f1f5f9)"
          strokeWidth={strokeW}
        />
        {buckets.map((b) => {
          if (b.count === 0) return null;
          const arcLength = (b.count / total) * circumference;
          const dashOffset = -assigned;
          const segment = (
            <circle
              key={b.key}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={BUCKET_COLOR[b.key]}
              strokeWidth={strokeW}
              strokeDasharray={`${arcLength} ${circumference - arcLength}`}
              strokeDashoffset={dashOffset}
            />
          );
          assigned += arcLength;
          return segment;
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-xl font-bold tabular-nums leading-none"
          style={{ color: 'var(--color-text-primary)' }}
        >
          {total}
        </span>
        <span
          className="mt-0.5 text-[9.5px] uppercase tracking-[0.10em]"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          WIP
        </span>
      </div>
    </>
  );
}

function EmptyDonut({ total }: { total: number }) {
  const size = 112;
  const strokeW = 18;
  const r = (size - strokeW) / 2;
  const cx = size / 2;
  const cy = size / 2;
  return (
    <>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="var(--color-surface-alt, #f1f5f9)"
          strokeWidth={strokeW}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-xl font-bold tabular-nums leading-none"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          {total}
        </span>
        <span
          className="mt-0.5 text-[9.5px] uppercase tracking-[0.10em]"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          WIP
        </span>
      </div>
    </>
  );
}
