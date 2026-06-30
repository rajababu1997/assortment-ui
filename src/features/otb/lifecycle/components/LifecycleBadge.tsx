/**
 * Pill badge for an OTB's lifecycle state. Mirrors the design of StateBadge
 * (VP / OP) so the All-OTBs grid stays visually consistent.
 */

import { CheckCircle2, CircleDashed, FileCheck2, LockIcon, PackageCheck } from 'lucide-react';
import { LIFECYCLE_LABELS } from '../constants';
import type { LifecycleState } from '../types';

const TONE: Record<
  LifecycleState,
  { bg: string; fg: string; border: string; Icon: typeof CircleDashed }
> = {
  planned:        { bg: 'bg-slate-100',   fg: 'text-slate-700',   border: 'border-slate-200',   Icon: CircleDashed },
  released:       { bg: 'bg-blue-100',    fg: 'text-blue-800',    border: 'border-blue-200',    Icon: PackageCheck },
  value_planned:  { bg: 'bg-indigo-100',  fg: 'text-indigo-800',  border: 'border-indigo-200',  Icon: FileCheck2 },
  option_planned: { bg: 'bg-emerald-100', fg: 'text-emerald-800', border: 'border-emerald-200', Icon: CheckCircle2 },
  final_approved: { bg: 'bg-amber-100',   fg: 'text-amber-800',   border: 'border-amber-200',   Icon: LockIcon },
};

export function LifecycleBadge({ state }: { state: LifecycleState }) {
  const tone = TONE[state];
  const { Icon } = tone;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${tone.bg} ${tone.fg} ${tone.border}`}
    >
      <Icon size={11} />
      {LIFECYCLE_LABELS[state]}
    </span>
  );
}
