/**
 * Horizontal strip of 5 stage cards (Planned → Released → Value Planned →
 * Option Planned → Final Approved). Each card shows whether the stage has
 * been reached, when, and who/what completed it. Used at the top of the
 * OTB detail page.
 */

import {
  CheckCircle2,
  CircleDashed,
  FileCheck2,
  LockIcon,
  PackageCheck,
  type LucideIcon,
} from 'lucide-react';
import { LIFECYCLE_ORDER } from '../constants';
import type { LifecycleState, OtbRowView } from '../types';

interface StageMeta {
  state: LifecycleState;
  label: string;
  Icon: LucideIcon;
  /** Pick the timestamp + sublabel for this stage from the summary. */
  pick: (s: OtbRowView) => { at?: number; sub?: string };
}

const STAGES: StageMeta[] = [
  {
    state: 'planned',
    label: 'Planned',
    Icon: CircleDashed,
    pick: (s) => ({ at: s.planned_at, sub: 'OTB created' }),
  },
  {
    state: 'released',
    label: 'Released',
    Icon: PackageCheck,
    pick: (s) => ({ at: s.released_at, sub: 'Period locked' }),
  },
  {
    state: 'value_planned',
    label: 'Value Planned',
    Icon: FileCheck2,
    pick: (s) => ({ at: s.vp_approved_at, sub: 'VP approved' }),
  },
  {
    state: 'option_planned',
    label: 'Option Planned',
    Icon: CheckCircle2,
    pick: (s) => ({ at: s.op_approved_at, sub: 'OP approved by designer' }),
  },
  {
    state: 'final_approved',
    label: 'Final Approved',
    Icon: LockIcon,
    pick: (s) => ({
      at: s.final_approved_at,
      sub: s.final_approved_by ? `Admin · ${s.final_approved_by.slice(0, 6)}…` : 'Closed by Admin',
    }),
  },
];

export function StageStrip({ summary }: { summary: OtbRowView }) {
  const currentIdx = LIFECYCLE_ORDER.indexOf(summary.lifecycle_state);
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
      {STAGES.map((stage, idx) => {
        const reached = idx <= currentIdx;
        const isCurrent = idx === currentIdx;
        const { at, sub } = stage.pick(summary);
        return (
          <div
            key={stage.state}
            className={
              `flex flex-col gap-1.5 rounded-lg border px-3 py-2 ${
                reached
                  ? isCurrent
                    ? 'border-emerald-300 bg-emerald-50/60'
                    : 'border-blue-200 bg-blue-50/60'
                  : 'border-slate-200 bg-slate-50/40 opacity-60'
              }`
            }
          >
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex h-6 w-6 items-center justify-center rounded-full ${
                  reached
                    ? isCurrent
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-blue-100 text-blue-700'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                <stage.Icon size={13} />
              </span>
              <span className="text-[12px] font-semibold text-slate-900">{stage.label}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px]" style={{ color: 'var(--color-text-tertiary)' }}>
                {sub ?? '—'}
              </span>
              <span className="text-[11px] tabular-nums" style={{ color: 'var(--color-text-secondary)' }}>
                {at ? new Date(at).toLocaleString() : reached ? '—' : 'Not yet'}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
