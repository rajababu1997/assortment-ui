/**
 * Pipeline funnel — horizontal stage chart showing how many plans/rows
 * sit at each lifecycle stage. Stage widths scale to the largest stage so
 * a buyer can spot bottlenecks at a glance ("submitted is huge → review
 * queue piling up").
 */

import { GitBranch } from 'lucide-react';
import type { FunnelStage } from '../useDashboardKpis';

interface Props {
  stages: FunnelStage[];
  isLoading: boolean;
}

const STAGE_COLOR: Record<FunnelStage['key'], string> = {
  draft: '#60a5fa',
  review: '#a78bfa',
  revisions: '#f59e0b',
  approved: '#22c55e',
  released: '#16a34a',
  final: '#0ea5e9',
};

export function PipelineFunnel({ stages, isLoading }: Props) {
  const max = Math.max(...stages.map((s) => s.count), 1);
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
            background: 'rgba(96,165,250,0.12)',
            color: 'var(--color-primary)',
          }}
        >
          <GitBranch size={12} />
        </span>
        <h3
          className="text-[12px] font-semibold uppercase tracking-[0.10em]"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Pipeline
        </h3>
      </header>

      <div className="flex flex-col gap-1.5 px-3 py-3">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-7 animate-pulse rounded-md"
                style={{ background: 'var(--color-surface-alt, #f1f5f9)' }}
              />
            ))
          : stages.map((s) => {
              const pct = (s.count / max) * 100;
              return (
                <div key={s.key} className="flex items-center gap-2">
                  <span
                    className="w-[88px] shrink-0 truncate text-[11px] font-medium"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    {s.label}
                  </span>
                  <div
                    className="relative h-6 flex-1 overflow-hidden rounded-md"
                    style={{ background: 'var(--color-surface-alt, #f1f5f9)' }}
                  >
                    <div
                      className="absolute inset-y-0 left-0 rounded-md transition-all"
                      style={{
                        width: `${Math.max(pct, s.count > 0 ? 4 : 0)}%`,
                        background: STAGE_COLOR[s.key],
                        opacity: s.count === 0 ? 0.18 : 0.85,
                      }}
                    />
                    <div className="relative flex h-full items-center px-2">
                      <span
                        className="text-[10.5px] font-semibold tabular-nums"
                        style={{
                          color: pct > 30 ? '#fff' : 'var(--color-text-primary)',
                          textShadow: pct > 30 ? '0 1px 1px rgba(0,0,0,0.15)' : 'none',
                        }}
                      >
                        {s.count}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
      </div>
    </section>
  );
}
