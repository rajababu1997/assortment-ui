/**
 * Option Plan per-band "Why AI" card — minimal, mirrors the VP card style.
 *
 * Only shows what a buyer needs to decide whether to trust the AI:
 *   1. LY options → TY options + shift indicator
 *   2. Reason lines from the backend
 *
 * Sub-type mix, unit counts, avg-per-option, MRP/cost etc. all live on the
 * main OP screen — no need to duplicate them here (and the LY-vs-TY unit
 * comparison was mixed-basis anyway: LY = units sold, TY = units at cost).
 */

import type { ChangeReason, RecommendedOptionBand } from '../types';

const REASON_ICON: Record<string, string> = {
  budget_cascade: '$',
  avg_per_option: '#',
  options_count: '=',
  subtype_mix: '⋮',
  note: 'i',
};

interface Props {
  band: RecommendedOptionBand;
}

export function OptionPlanExplanationCard({ band }: Props) {
  const ly = band.lySnapshot;
  const reasons = band.reasons ?? [];

  if (!ly) return null;

  const lyOptions = ly.optionsActive;
  const tyOptions = Number(band.optionPlanQty);
  const shift = tyOptions - lyOptions;
  const flat = shift === 0;

  const shiftColor = flat ? 'var(--color-text-tertiary)' : shift > 0 ? '#047857' : '#b91c1c';
  const shiftLabel = flat
    ? 'unchanged'
    : `${shift > 0 ? '+' : ''}${shift} opt vs LY`;

  return (
    <div className="flex flex-col">
      {/* Options LY → TY */}
      <div className="border-b px-3 py-3" style={{ borderColor: 'var(--color-divider)' }}>
        <div
          className="text-[10px] font-semibold uppercase tracking-[0.12em]"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          Options in this band
        </div>
        <div className="mt-2 flex items-baseline gap-3 text-[13px] tabular-nums">
          <span style={{ color: 'var(--color-text-tertiary)' }}>Last year</span>
          <strong style={{ color: 'var(--color-text-primary)' }}>{lyOptions}</strong>
          <span style={{ color: 'var(--color-text-tertiary)' }}>→</span>
          <span style={{ color: 'var(--color-text-tertiary)' }}>This year</span>
          <strong style={{ color: 'var(--color-primary)' }}>{tyOptions}</strong>
          <span className="ml-auto text-[11px] font-semibold" style={{ color: shiftColor }}>
            {shiftLabel}
          </span>
        </div>
      </div>

      {/* Reasons */}
      {reasons.length > 0 && (
        <div className="px-3 py-3">
          <div
            className="text-[10px] font-semibold uppercase tracking-[0.12em]"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            Why this option count
          </div>
          <ul className="mt-1.5 flex flex-col gap-1.5">
            {reasons.map((r, i) => (
              <ReasonRow key={`${r.type}-${i}`} reason={r} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ReasonRow({ reason }: { reason: ChangeReason }) {
  const icon = REASON_ICON[reason.type] ?? '·';
  return (
    <li className="flex items-start gap-2 text-[11.5px]" style={{ color: 'var(--color-text-secondary)' }}>
      <span
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[10px] font-bold"
        style={{
          background: 'color-mix(in srgb, var(--color-primary) 10%, transparent)',
          color: 'var(--color-primary)',
        }}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1 leading-snug">{reason.text}</div>
    </li>
  );
}
