/**
 * Small up/down arrow + coloured delta text — shared by KPI tiles and
 * table Growth-vs-LY columns.
 */

import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

interface Props {
  /** Signed delta as a percent (e.g. 18.6 for "+18.6%"). */
  value: number;
  /** When true, positive is "good" (green); when false, positive is "bad" (red). */
  higherBetter?: boolean;
  /** Suffix — defaults to "%". Pass "pp" for percentage-point deltas. */
  suffix?: string;
  /** Small tail — e.g. "vs LY". */
  tail?: string;
  digits?: number;
}

export function DeltaBadge({
  value,
  higherBetter = true,
  suffix = '%',
  tail,
  digits = 1,
}: Props) {
  const abs = Math.abs(value);
  const isFlat = abs < 0.05;
  const isPositive = value > 0;
  const good = higherBetter ? isPositive : !isPositive;
  const color = isFlat
    ? 'var(--color-text-tertiary)'
    : good ? '#047857' : '#b91c1c';
  const Icon = isFlat ? Minus : isPositive ? ArrowUp : ArrowDown;

  return (
    <span
      className="inline-flex items-center gap-1 text-[11px] font-semibold tabular-nums"
      style={{ color }}
    >
      <Icon size={11} strokeWidth={2.5} />
      {isPositive ? '' : value < 0 ? '−' : ''}{abs.toFixed(digits)}{suffix}
      {tail && (
        <span className="ml-1 font-normal" style={{ color: 'var(--color-text-tertiary)' }}>
          {tail}
        </span>
      )}
    </span>
  );
}
