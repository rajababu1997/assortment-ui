/**
 * Planning Pipeline — 5 stages of the OTB lifecycle. Each stage shows
 * "complete / total" + a colored progress bar. The light dot at the end
 * (🟢 / 🟡 / 🔴) is the tone summary so the eye can scan vertically.
 */

import { Workflow } from 'lucide-react';
import type { PipelineStage } from '../useDashboardSections';

interface Props {
  stages: PipelineStage[];
  isLoading: boolean;
}

const TONE_COLOR: Record<PipelineStage['tone'], string> = {
  success: '#16a34a',
  warning: '#f59e0b',
  danger: '#ef4444',
  neutral: '#94a3b8',
};

const TONE_DOT: Record<PipelineStage['tone'], string> = {
  success: '🟢',
  warning: '🟡',
  danger: '🔴',
  neutral: '⚪',
};

export function PlanningPipeline({ stages, isLoading }: Props) {
  return (
    <section
      className="rounded-xl border"
      style={{ background: 'var(--color-surface)', borderColor: 'var(--color-divider)' }}
    >
      <header
        className="flex items-center gap-2 border-b px-3 py-2"
        style={{ borderColor: 'var(--color-divider)' }}
      >
        <span
          className="flex h-6 w-6 items-center justify-center rounded-md"
          style={{
            background: 'rgba(96,165,250,0.12)',
            color: 'var(--color-primary)',
          }}
        >
          <Workflow size={12} />
        </span>
        <h3
          className="text-[12px] font-semibold uppercase tracking-[0.10em]"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Planning Pipeline
        </h3>
      </header>

      <div className="flex flex-col gap-2 px-3 py-3">
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-9 animate-pulse rounded-md"
                style={{ background: 'var(--color-surface-alt, #f1f5f9)' }}
              />
            ))
          : stages.map((s) => {
              const pct = s.total > 0 ? (s.complete / s.total) * 100 : 0;
              return (
                <div key={s.key} className="flex items-center gap-3">
                  <div className="w-[120px] shrink-0">
                    <div
                      className="text-[12px] font-medium"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      {s.label}
                    </div>
                    <div
                      className="text-[10.5px] tabular-nums"
                      style={{ color: 'var(--color-text-tertiary)' }}
                    >
                      {s.complete} / {s.total} complete
                    </div>
                  </div>
                  <div
                    className="relative h-3 flex-1 overflow-hidden rounded-full"
                    style={{ background: 'var(--color-surface-alt, #f1f5f9)' }}
                  >
                    <div
                      className="absolute inset-y-0 left-0 rounded-full"
                      style={{
                        width: `${pct}%`,
                        background: TONE_COLOR[s.tone],
                      }}
                    />
                  </div>
                  <span className="w-12 shrink-0 text-right text-[11px] tabular-nums"
                    style={{ color: 'var(--color-text-secondary)' }}>
                    {Math.round(pct)}%
                  </span>
                  <span className="w-4 shrink-0 text-center text-[12px]" aria-hidden>
                    {TONE_DOT[s.tone]}
                  </span>
                </div>
              );
            })}
      </div>
    </section>
  );
}
