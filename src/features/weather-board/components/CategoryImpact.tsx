/**
 * Compact impact rail — boost list on left, reduce list on right.
 * Each item is a chip; hovering shows the underlying reason (avg temp,
 * rainy days, etc.) so the buyer can trace it back to the numbers.
 */

import { ArrowDown, ArrowUp } from 'lucide-react';
import type { CategoryImpact as CategoryImpactRow } from '../types';

interface Props {
  items: CategoryImpactRow[];
}

export function CategoryImpact({ items }: Props) {
  const boost = items.filter((i) => i.direction === 'boost');
  const reduce = items.filter((i) => i.direction === 'reduce');

  return (
    <div className="flex flex-col gap-1.5">
      <div
        className="text-[9px] font-bold uppercase tracking-[0.12em]"
        style={{ color: 'var(--color-text-tertiary)' }}
      >
        Category impact — buyer guidance
      </div>

      {boost.length > 0 && (
        <div className="flex flex-wrap items-center gap-1">
          <span
            className="inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider"
            style={{ background: 'rgba(16,185,129,0.14)', color: '#047857' }}
          >
            <ArrowUp size={9} /> Boost
          </span>
          {boost.map((i) => (
            <span
              key={`b-${i.category}`}
              className="rounded-full border px-2 py-0.5 text-[10.5px] font-medium"
              style={{
                background: 'rgba(16,185,129,0.06)',
                borderColor: 'rgba(16,185,129,0.30)',
                color: '#047857',
              }}
              title={i.reason}
            >
              {i.category}
            </span>
          ))}
        </div>
      )}

      {reduce.length > 0 && (
        <div className="flex flex-wrap items-center gap-1">
          <span
            className="inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider"
            style={{ background: 'rgba(239,68,68,0.12)', color: '#b91c1c' }}
          >
            <ArrowDown size={9} /> Reduce
          </span>
          {reduce.map((i) => (
            <span
              key={`r-${i.category}`}
              className="rounded-full border px-2 py-0.5 text-[10.5px] font-medium"
              style={{
                background: 'rgba(239,68,68,0.06)',
                borderColor: 'rgba(239,68,68,0.28)',
                color: '#b91c1c',
              }}
              title={i.reason}
            >
              {i.category}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
