/**
 * AI insight strip — 2–3 short analyst-style notes derived from the
 * historical aggregate vs the planner's current draft.
 *
 * Hand-rolled rules for the demo; in production these come from a
 * forecast / insight microservice.
 */

import { Lightbulb } from 'lucide-react';

export interface Insight {
  tone: 'positive' | 'warning' | 'info';
  message: string;
}

export function AiInsightPanel({ insights }: { insights: Insight[] }) {
  if (insights.length === 0) return null;
  return (
    <div className="rounded border border-[var(--color-divider)] p-3 bg-[var(--color-bg-subtle)]">
      <div className="flex items-center gap-2 mb-2">
        <Lightbulb size={12} className="text-[var(--color-primary)]" />
        <span className="text-xs font-semibold">Signals from last year</span>
      </div>
      <ul className="flex flex-col gap-1.5 text-xs">
        {insights.map((it, i) => {
          const toneClass =
            it.tone === 'positive'
              ? 'text-[var(--color-success)]'
              : it.tone === 'warning'
                ? 'text-[var(--color-warning)]'
                : 'text-[var(--color-text-secondary)]';
          return (
            <li key={i} className="flex gap-2">
              <span className={`mt-1 inline-block w-1.5 h-1.5 rounded-full flex-shrink-0 ${toneClass.replace('text-', 'bg-')}`} />
              <span>{it.message}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
