/**
 * Last-year reference strip — shows what the buyer filled into the option
 * sub-grids LY for this same category × MRP band. Read-only, dummy-data
 * only. Replaces the per-band SalesInsightsPanel: the buyer's most useful
 * anchor when deciding this season's mix is "what did we actually do last
 * year and did it work?".
 */

import { useState } from 'react';
import { ChevronDown, ChevronUp, History } from 'lucide-react';
import type { MrpBand } from '@/features/otb/types';

interface LyBandPlan {
  avgPerOption: number;
  optionPlanQty: number;
  fabricType:  Array<{ key: string; label: string; qty: number }>;
  fit:         Array<{ key: string; label: string; qty: number }>;
  composition: Array<{ key: string; label: string; qty: number }>;
}

const LY_BY_BAND: Record<MrpBand['id'], LyBandPlan> = {
  entry: {
    avgPerOption: 400,
    optionPlanQty: 14,
    fabricType:  [{ key: 'plain', label: 'Plain', qty: 6 }, { key: 'printed', label: 'Printed', qty: 4 }, { key: 'checks', label: 'Checks', qty: 3 }, { key: 'strips', label: 'Strips', qty: 1 }],
    fit:         [{ key: 'regular_fit', label: 'Regular Fit', qty: 10 }, { key: 'slim_fit', label: 'Slim Fit', qty: 4 }],
    composition: [{ key: 'cotton_100', label: '100% Cotton', qty: 10 }, { key: 'polyester_100', label: '100% Polyester', qty: 4 }],
  },
  core: {
    avgPerOption: 300,
    optionPlanQty: 18,
    fabricType:  [{ key: 'plain', label: 'Plain', qty: 8 }, { key: 'printed', label: 'Printed', qty: 5 }, { key: 'checks', label: 'Checks', qty: 3 }, { key: 'strips', label: 'Strips', qty: 2 }],
    fit:         [{ key: 'regular_fit', label: 'Regular Fit', qty: 12 }, { key: 'slim_fit', label: 'Slim Fit', qty: 6 }],
    composition: [{ key: 'cotton_100', label: '100% Cotton', qty: 13 }, { key: 'polyester_100', label: '100% Polyester', qty: 5 }],
  },
  upper: {
    avgPerOption: 200,
    optionPlanQty: 10,
    fabricType:  [{ key: 'plain', label: 'Plain', qty: 5 }, { key: 'printed', label: 'Printed', qty: 3 }, { key: 'checks', label: 'Checks', qty: 1 }, { key: 'strips', label: 'Strips', qty: 1 }],
    fit:         [{ key: 'regular_fit', label: 'Regular Fit', qty: 7 }, { key: 'slim_fit', label: 'Slim Fit', qty: 3 }],
    composition: [{ key: 'cotton_100', label: '100% Cotton', qty: 8 }, { key: 'polyester_100', label: '100% Polyester', qty: 2 }],
  },
  statement: {
    avgPerOption: 120,
    optionPlanQty: 6,
    fabricType:  [{ key: 'plain', label: 'Plain', qty: 3 }, { key: 'printed', label: 'Printed', qty: 2 }, { key: 'checks', label: 'Checks', qty: 1 }, { key: 'strips', label: 'Strips', qty: 0 }],
    fit:         [{ key: 'regular_fit', label: 'Regular Fit', qty: 5 }, { key: 'slim_fit', label: 'Slim Fit', qty: 1 }],
    composition: [{ key: 'cotton_100', label: '100% Cotton', qty: 5 }, { key: 'polyester_100', label: '100% Polyester', qty: 1 }],
  },
};

interface Props {
  bandId: MrpBand['id'];
  /** Display label, e.g. "LY Jan 2025" */
  periodLabel: string;
}

export function LastYearReference({ bandId, periodLabel }: Props) {
  const ly = LY_BY_BAND[bandId];
  const [open, setOpen] = useState(false);
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
