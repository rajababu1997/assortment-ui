/**
 * Chronological audit log — the strip at the bottom of the detail page.
 * Source of truth for "when did this OTB move to X, and who did it?".
 *
 * Reads directly from `OtbLifecycleEvent[]` (already sorted by created_time
 * ASC on the server). No filtering / paging at this scale — one OTB has at
 * most 5-ish transitions.
 */

import { ArrowRight, History } from 'lucide-react';
import { LIFECYCLE_LABELS } from '../constants';
import type { OtbLifecycleEvent } from '../types';

export function TimelineStrip({ events }: { events: OtbLifecycleEvent[] }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white">
      <header className="flex items-center gap-2 border-b border-slate-200 px-3 py-2">
        <History size={14} className="text-slate-500" />
        <h3 className="text-[12px] font-semibold uppercase tracking-wider text-slate-600">
          Audit log
        </h3>
        <span className="ml-auto text-[11px] text-slate-500">{events.length} event{events.length === 1 ? '' : 's'}</span>
      </header>
      {events.length === 0 ? (
        <div className="px-3 py-4 text-center text-[12px] text-slate-500">
          No transitions yet — this OTB hasn't moved past PLANNED.
        </div>
      ) : (
        <ol className="flex flex-col">
          {events.map((e) => (
            <li
              key={e.uuid ?? `${e.plan_uuid}-${e.event_at}`}
              className="flex flex-wrap items-center gap-2 border-t border-slate-100 px-3 py-2 first:border-t-0"
            >
              <span className="min-w-[150px] text-[11px] tabular-nums text-slate-500">
                {new Date(e.event_at).toLocaleString()}
              </span>
              <span className="inline-flex items-center gap-1 text-[12px] text-slate-900">
                {e.from_state && (
                  <>
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10.5px] uppercase tracking-wide text-slate-600">
                      {LIFECYCLE_LABELS[e.from_state]}
                    </span>
                    <ArrowRight size={11} className="text-slate-400" />
                  </>
                )}
                <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide text-blue-800">
                  {LIFECYCLE_LABELS[e.to_state]}
                </span>
              </span>
              {e.note && (
                <span className="ml-auto max-w-[420px] text-[11.5px] italic text-slate-600">
                  “{e.note}”
                </span>
              )}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
