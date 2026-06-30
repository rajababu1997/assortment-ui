/**
 * One sub-grid inside a band section — a single OptionType (Fabric Type /
 * Fit / Composition) with the catalogue's sub-types listed and quantity
 * inputs alongside. Reusable across all 3 dimensions.
 *
 * Layout: title strip · per-sub-type row (label · LY share chip · qty input) ·
 * footer (Σ qty vs option_plan_qty).
 *
 * The buyer types qty per sub-type; the footer chip turns red if Σ exceeds
 * option_plan_qty, amber if Σ is zero (sub-grid must carry at least 1 for
 * SUBMIT), green otherwise.
 */

import { CheckCircle2, AlertTriangle } from 'lucide-react';
import { NumberInput } from '@/components/primitives';
import {
  OPTION_TYPE_LABELS,
  SUB_TYPE_CATALOGUE,
  type OptionType,
} from '../constants';
import type { OptionLine, OptionBand } from '../types';

interface Props {
  band: Pick<OptionBand, 'band_id' | 'lines' | 'option_plan_qty'>;
  optionType: OptionType;
  /** Allowed total qty ceiling. Usually = band.option_plan_qty. */
  cap: number;
  readOnly: boolean;
  onChange: (subTypeKey: string, subTypeLabel: string, qty: number) => void;
}

export function SubGrid({ band, optionType, cap, readOnly, onChange }: Props) {
  const subTypes = SUB_TYPE_CATALOGUE[optionType];
  const lineByKey: Record<string, OptionLine | undefined> = {};
  for (const l of band.lines) {
    if (l.option_type === optionType) lineByKey[l.sub_type_key] = l;
  }

  const sum = subTypes.reduce((s, st) => s + (lineByKey[st.key]?.qty ?? 0), 0);
  const remaining = cap - sum;

  const tone =
    cap <= 0 || sum === 0 ? 'neutral' : remaining < 0 ? 'danger' : remaining === 0 ? 'success' : 'info';
  const toneStyle: Record<string, { bg: string; fg: string }> = {
    neutral: { bg: 'rgba(148,163,184,0.12)', fg: '#475569' },
    danger:  { bg: 'rgba(239,68,68,0.12)',   fg: '#b91c1c' },
    success: { bg: 'rgba(34,197,94,0.12)',   fg: '#15803d' },
    info:    { bg: 'rgba(59,130,246,0.12)',  fg: '#1d4ed8' },
  };

  return (
    <div
      className="flex shrink-0 flex-col overflow-hidden rounded-lg border"
      style={{ borderColor: 'var(--color-divider)', background: 'var(--color-surface)' }}
    >
      <div
        className="flex items-center justify-between border-b border-blue-200 bg-blue-50 px-3 py-2 text-[12px] font-semibold text-blue-900"
      >
        <span>{OPTION_TYPE_LABELS[optionType]}</span>
        <span className="text-blue-700/70">
          {subTypes.length} options
        </span>
      </div>

      <ul className="divide-y" style={{ borderColor: 'var(--color-divider)' }}>
        {subTypes.map((st) => {
          const line = lineByKey[st.key];
          return (
            <li key={st.key} className="flex items-center gap-3 px-3 py-2">
              <div className="flex-1 text-[13px]" style={{ color: 'var(--color-text-primary)' }}>
                {st.label}
              </div>
              <div style={{ width: 96 }}>
                <NumberInput
                  value={line?.qty ?? null}
                  onChange={(v) => onChange(st.key, st.label, Math.max(0, Math.floor(v ?? 0)))}
                  min={0}
                  max={cap > 0 ? cap : undefined}
                  step={1}
                  showButtons={false}
                  disabled={readOnly || cap <= 0}
                />
              </div>
            </li>
          );
        })}
      </ul>

      <div
        className="flex items-center justify-between border-t px-3 py-2 text-[11.5px]"
        style={{
          borderColor: 'var(--color-divider)',
          background: 'var(--color-surface-alt, #f8fafc)',
        }}
      >
        <span style={{ color: 'var(--color-text-tertiary)' }}>
          Total qty · max {cap}
        </span>
        <span
          className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
          style={{ background: toneStyle[tone].bg, color: toneStyle[tone].fg }}
        >
          {tone === 'danger' && <AlertTriangle size={11} />}
          {tone === 'success' && <CheckCircle2 size={11} />}
          {sum} / {cap}
          {remaining !== 0 && cap > 0 && (
            <span style={{ fontWeight: 500 }}>({remaining > 0 ? `+${remaining}` : remaining})</span>
          )}
        </span>
      </div>
    </div>
  );
}
