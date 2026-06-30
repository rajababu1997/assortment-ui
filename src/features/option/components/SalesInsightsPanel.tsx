/**
 * Per-band Sales Insights panel — collapsible. Shows LY mix per OptionType
 * (Fabric Type / Fit / Composition) and per-sub-type performance metrics.
 *
 * Buyer uses this to decide where to push options within each MRP band.
 * Designer (Phase 7) sees the same panel — designer-specific lenses can be
 * layered on top later.
 */

import { useState } from 'react';
import { Activity, ChevronDown, ChevronUp, TrendingDown, TrendingUp } from 'lucide-react';
import { OPTION_TYPE_LABELS, OPTION_TYPES, type OptionType } from '../constants';
import type { OptionPlanInsights, SubTypeLyPerformance } from '../mockData/salesInsights';
import type { MrpBand } from '@/features/otb/types';

const TYPES: OptionType[] = [OPTION_TYPES.FABRIC_TYPE, OPTION_TYPES.FIT, OPTION_TYPES.COMPOSITION];

function tone(value: number, good: number, ok: number, reverse = false): string {
  // reverse=true for return%/markdown% where lower is better.
  const isGood = reverse ? value <= good : value >= good;
  const isOk = reverse ? value <= ok : value >= ok;
  if (isGood) return '#15803d';
  if (isOk) return '#b45309';
  return '#b91c1c';
}

function Cell({
  value,
  suffix = '%',
  color,
}: { value: number; suffix?: string; color?: string }) {
  return (
    <span className="font-medium" style={{ color }}>
      {value}
      {suffix}
    </span>
  );
}

interface Props {
  bandId: MrpBand['id'];
  insights: OptionPlanInsights;
}

export function SalesInsightsPanel({ bandId, insights }: Props) {
  const [open, setOpen] = useState(false);
  const [activeType, setActiveType] = useState<OptionType>(OPTION_TYPES.FABRIC_TYPE);

  const block = insights.per_band_per_type.find(
    (b) => b.band_id === bandId && b.option_type === activeType,
  );

  return (
    <div
      className="rounded-lg border"
      style={{ borderColor: 'var(--color-divider)', background: 'var(--color-surface)' }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-3.5 py-2"
      >
        <div className="flex items-center gap-2 text-[12.5px]">
          <Activity size={13} style={{ color: 'var(--color-primary)' }} />
          <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
            Sales Insights · LY {insights.ly_period_label}
          </span>
        </div>
        {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
      </button>

      {open && (
        <div className="px-3.5 pb-3.5">
          <div className="mb-3 flex gap-1.5 rounded-md p-1" style={{ background: 'var(--color-surface-alt, #f1f5f9)' }}>
            {TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setActiveType(t)}
                className="rounded px-2.5 py-1 text-[11.5px] font-medium transition"
                style={{
                  background: t === activeType ? 'var(--color-surface)' : 'transparent',
                  color:
                    t === activeType ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
                  boxShadow: t === activeType ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                }}
              >
                {OPTION_TYPE_LABELS[t]}
              </button>
            ))}
          </div>

          {block ? (
            <PerfTable subTypes={block.sub_types} />
          ) : (
            <p className="text-[12px]" style={{ color: 'var(--color-text-tertiary)' }}>
              No LY data for this dimension.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function PerfTable({ subTypes }: { subTypes: SubTypeLyPerformance[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[11.5px]">
        <thead>
          <tr style={{ color: 'var(--color-text-tertiary)' }}>
            <th className="py-1.5 pr-2 text-left font-medium">Sub-type</th>
            <th className="px-1.5 py-1.5 text-right font-medium">Vol%</th>
            <th className="px-1.5 py-1.5 text-right font-medium">Rev%</th>
            <th className="px-1.5 py-1.5 text-right font-medium">ST%</th>
            <th className="px-1.5 py-1.5 text-right font-medium">MD%</th>
            <th className="px-1.5 py-1.5 text-right font-medium">Margin%</th>
            <th className="px-1.5 py-1.5 text-right font-medium">Return%</th>
            <th className="py-1.5 pl-2 text-right font-medium">YoY</th>
          </tr>
        </thead>
        <tbody>
          {subTypes.map((s) => (
            <tr
              key={s.sub_type_key}
              className="border-t"
              style={{ borderColor: 'var(--color-divider)' }}
            >
              <td className="py-1.5 pr-2" style={{ color: 'var(--color-text-primary)' }}>
                {s.sub_type_label}
              </td>
              <td className="px-1.5 py-1.5 text-right">
                <Cell value={s.vol_pct} />
              </td>
              <td className="px-1.5 py-1.5 text-right">
                <Cell value={s.rev_pct} />
              </td>
              <td className="px-1.5 py-1.5 text-right">
                <Cell value={s.sell_through_pct} color={tone(s.sell_through_pct, 75, 60)} />
              </td>
              <td className="px-1.5 py-1.5 text-right">
                <Cell value={s.markdown_depth_pct} color={tone(s.markdown_depth_pct, 15, 25, true)} />
              </td>
              <td className="px-1.5 py-1.5 text-right">
                <Cell value={s.realized_margin_pct} color={tone(s.realized_margin_pct, 65, 55)} />
              </td>
              <td className="px-1.5 py-1.5 text-right">
                <Cell value={s.return_pct} color={tone(s.return_pct, 3, 4, true)} />
              </td>
              <td className="py-1.5 pl-2 text-right">
                <span
                  className="inline-flex items-center gap-0.5 font-medium"
                  style={{ color: s.yoy_pct >= 0 ? '#15803d' : '#b91c1c' }}
                >
                  {s.yoy_pct >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                  {s.yoy_pct >= 0 ? '+' : ''}
                  {s.yoy_pct}%
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
