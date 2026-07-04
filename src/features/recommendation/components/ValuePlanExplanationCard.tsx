/**
 * Value Plan per-band "Why AI" card — minimal.
 *
 * Only shows the three things a buyer needs to decide whether to trust the AI:
 *   1. LY share % vs TY share % + shift indicator
 *   2. Reason lines from the backend
 *
 * Everything else (revenue, units, MRP, cost, GP, markdown, cascade path)
 * is available on the main VP screen — no need to duplicate it here.
 */

import type { ChangeReason, RecommendedValuePlanBand } from '../types';

const REASON_ICON: Record<string, string> = {
  budget_cascade: '$',
  calendar_shift: '📅',
  note: 'i',
};

interface Props {
  band: RecommendedValuePlanBand;
}

export function ValuePlanExplanationCard({ band }: Props) {
  const ly = band.lySnapshot;
  const ty = band.tySnapshot;
  const reasons = band.reasons ?? [];

  if (!ly || !ty) return null;

  const lyShare = Math.round(ly.revenueSharePct);
  const tyShare = Math.round(ty.budgetPct);
  const shift = tyShare - lyShare;
  const flat = shift === 0;

  const shiftColor = flat ? 'var(--color-text-tertiary)' : shift > 0 ? '#047857' : '#b91c1c';
  const shiftLabel = flat
    ? 'unchanged'
    : `${shift > 0 ? '+' : ''}${shift} pp vs LY`;

  return (
    <div className="flex flex-col">
      {/* Share LY → TY */}
      <div className="border-b px-3 py-3" style={{ borderColor: 'var(--color-divider)' }}>
        <div
          className="text-[10px] font-semibold uppercase tracking-[0.12em]"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          Share of VP budget
        </div>
        <div className="mt-2 flex items-baseline gap-3 text-[13px] tabular-nums">
          <span style={{ color: 'var(--color-text-tertiary)' }}>Last year</span>
          <strong style={{ color: 'var(--color-text-primary)' }}>{lyShare}%</strong>
          <span style={{ color: 'var(--color-text-tertiary)' }}>→</span>
          <span style={{ color: 'var(--color-text-tertiary)' }}>This year</span>
          <strong style={{ color: 'var(--color-primary)' }}>{tyShare}%</strong>
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
            Why this share
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
