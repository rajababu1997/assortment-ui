/**
 * Last-year reference strip — shows what was actually launched in the same
 * (brand × category × band × month) one year ago. Sourced from the
 * `/sales/aggregate` + `/sales/attribute` mock backends via
 * `useLastYearOptionRef`.
 */

import { useState } from 'react';
import { ChevronDown, ChevronUp, History } from 'lucide-react';
import type { MrpBand } from '@/features/otb/types';
import { useLastYearOptionRef } from '@/features/sales/useInsights';

interface Props {
  bandId: MrpBand['id'];
  /** Display label, e.g. "LY Jan 2025" */
  periodLabel: string;
  brandUuid: string;
  categoryUuid: string;
  /** LY period label, e.g. "Jan 2025" — used to query the backend. */
  lyPeriodLabel: string;
}

export function LastYearReference({
  bandId, periodLabel, brandUuid, categoryUuid, lyPeriodLabel,
}: Props) {
  const [open, setOpen] = useState(false);
  const { data } = useLastYearOptionRef({
    brand_uuid: brandUuid,
    category_uuid: categoryUuid,
    ly_period_label: lyPeriodLabel,
  });
  const ly = data?.[bandId];
  if (!ly) return null;

  const totalUnits = ly.avgPerOption * ly.optionPlanQty;

  return (
    <section className="rounded-md border border-slate-200 bg-slate-50/60">
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setOpen((v) => !v);
          }
        }}
        className={`flex w-full cursor-pointer flex-wrap items-center gap-3 px-3 py-1.5 hover:bg-slate-100/60 ${open ? 'border-b border-slate-200' : ''}`}
      >
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
          <History size={12} />
          Last year reference · {periodLabel}
        </span>
        <span className="ml-auto flex flex-wrap items-center gap-3 text-[11px] text-slate-600">
          <KvPair label="Avg/option" value={ly.avgPerOption.toLocaleString()} />
          <KvPair label="Option qty" value={ly.optionPlanQty.toLocaleString()} />
          <KvPair label="Total units" value={totalUnits.toLocaleString()} />
          <span className="inline-flex h-5 w-5 items-center justify-center rounded border border-slate-200 bg-white text-slate-500">
            {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </span>
        </span>
      </div>

      {open && (
        <div className="flex flex-col divide-y divide-slate-200 text-[11.5px]">
          <SubRow title="Fabric Type" items={ly.fabricType} />
          <SubRow title="Fit"          items={ly.fit} />
          <SubRow title="Composition"  items={ly.composition} />
        </div>
      )}
    </section>
  );
}

function KvPair({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold tabular-nums text-slate-900">{value}</span>
    </span>
  );
}

function SubRow({
  title, items,
}: {
  title: string;
  items: Array<{ key: string; label: string; qty: number }>;
}) {
  const sum = items.reduce((s, i) => s + i.qty, 0);
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-1.5">
      <span className="min-w-[100px] text-[10.5px] font-semibold uppercase tracking-wider text-slate-500">
        {title}
      </span>
      {items.map((i) => (
        <span
          key={i.key}
          className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[11px] tabular-nums"
          style={{ border: '1px solid #e2e8f0' }}
        >
          <span className="text-slate-700">{i.label}</span>
          <span className="font-semibold text-slate-900">{i.qty}</span>
        </span>
      ))}
      <span className="ml-auto text-[10.5px] tabular-nums text-slate-500">
        Total {sum}
      </span>
    </div>
  );
}
