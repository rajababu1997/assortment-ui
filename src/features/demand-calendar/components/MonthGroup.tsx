/**
 * Month-heading + grid of SignalCards. Rendered once per month present in
 * the filtered result.
 */

import type { Signal } from '../types';
import { monthName } from '../utils';
import { SignalCard } from './SignalCard';

interface Props {
  monthIdx: number;
  signals: Signal[];
}

export function MonthGroup({ monthIdx, signals }: Props) {
  return (
    <section className="flex flex-col gap-2">
      <header className="flex items-center gap-2">
        <div
          className="h-6 w-1 rounded-full"
          style={{ background: 'linear-gradient(180deg, #60a5fa, #a78bfa)' }}
        />
        <h2
          className="text-[11px] font-bold uppercase tracking-[0.16em]"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {monthName(monthIdx)} 2026
        </h2>
        <span
          className="rounded-full px-1.5 py-0 text-[10px] font-semibold tabular-nums"
          style={{
            background: 'var(--color-surface-alt, #f1f5f9)',
            color: 'var(--color-text-tertiary)',
          }}
        >
          {signals.length}
        </span>
      </header>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {signals.map((s) => <SignalCard key={s.id} signal={s} />)}
      </div>
    </section>
  );
}
