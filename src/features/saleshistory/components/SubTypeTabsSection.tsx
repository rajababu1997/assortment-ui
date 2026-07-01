/**
 * Sub-type performance tabs — what's the best/worst fabric, fit, composition?
 *
 * For each option type the buyer sees a ranked horizontal bar list of
 * sub-types: name, share-bar, net sales, units, STR%, GM%, MD%. Designers
 * use this to know e.g. "rib-knit sells through 18 pp better than jersey".
 */

import { useMemo, useState } from 'react';
import { Shirt } from 'lucide-react';
import { useSalesAttribute } from '@/features/sales/useSales';
import type { SalesAttributeRow } from '@/features/sales/types';
import { fmtMoneyCompact, fmtPct, fmtUnits } from '../format';
import { HEADER_BG } from './cardStyle';
import { SectionInfoButton } from './SectionInfoButton';
import type { DashboardFilters } from '../useDashboardFilters';

type OptionType = 'fabric_type' | 'fit' | 'composition';
const TABS: { key: OptionType; label: string }[] = [
  { key: 'fabric_type', label: 'Fabric type' },
  { key: 'fit',         label: 'Fit' },
  { key: 'composition', label: 'Composition' },
];

interface SubTypeSummary {
  subTypeKey: string;
  netSalesValue: number;
  netSalesUnits: number;
  gpPct: number;
  markdownPct: number;
  strPct: number;
  sharePct: number;
}

export function SubTypeTabsSection({ filters }: { filters: DashboardFilters }) {
  const [tab, setTab] = useState<OptionType>('fabric_type');

  const { data: rows = [], isLoading } = useSalesAttribute({
    brand: filters.brands,
    category: filters.categories,
    optionType: tab,
    from: filters.from,
    to: filters.to,
  });

  const summaries = useMemo(() => aggregateBySubType(rows), [rows]);
  const max = summaries[0]?.netSalesValue ?? 0;

  return (
    <section
      className="flex flex-col rounded-xl border"
      style={{ background: 'var(--color-surface)', borderColor: 'var(--color-divider)' }}
    >
      <header
        className="flex items-center justify-between gap-2 border-b px-4 py-2.5"
        style={{ borderColor: 'var(--color-divider)', background: HEADER_BG }}
      >
        <div className="flex items-center gap-2">
          <Shirt size={14} style={{ color: 'var(--color-primary)' }} />
          <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Sub-type performance
          </h3>
          <SectionInfoButton title="Sub-type performance">
            <p>How each sub-type performs across three product dimensions — <strong>Fabric type</strong>, <strong>Fit</strong>, and <strong>Composition</strong>.</p>
            <p className="mt-2">Switch tabs to swap dimension.</p>
            <p className="mt-3"><strong>Columns:</strong></p>
            <ul className="mt-1 list-disc space-y-1 pl-5">
              <li><strong>Sub-type</strong> with share bar — visual ranking.</li>
              <li><strong>Net Sales</strong> and <strong>Units</strong>.</li>
              <li><strong>GM%</strong> — Gross Margin.</li>
              <li><strong>MD%</strong> — Markdown depth.</li>
              <li><strong>STR%</strong> — Sell-Through.</li>
            </ul>
            <p className="mt-3">All filters apply. The top 12 sub-types are shown, sorted by Net Sales (highest first).</p>
            <p className="mt-3">Use this to spot patterns like "rib-knit sells through 18 pp better than jersey" — backed by data, not opinion.</p>
          </SectionInfoButton>
        </div>
        <div className="flex items-center gap-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className="rounded-md px-2 py-1 text-[11px] font-medium"
              style={{
                background: tab === t.key ? 'var(--color-primary)' : 'transparent',
                color: tab === t.key ? '#fff' : 'var(--color-text-secondary)',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      {isLoading ? (
        <Empty>Loading {TABS.find((t) => t.key === tab)?.label}…</Empty>
      ) : summaries.length === 0 ? (
        <Empty>No {TABS.find((t) => t.key === tab)?.label} data in this slice.</Empty>
      ) : (
        <div className="flex flex-col gap-1 p-3">
          {/* Header row */}
          <div
            className="grid grid-cols-[1fr_120px_80px_64px_64px_64px] items-center gap-2 px-2 text-[10px] font-semibold uppercase tracking-wider"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            <div>Sub-type</div>
            <div className="text-right">Net Sales</div>
            <div className="text-right">Units</div>
            <div className="text-right">GM%</div>
            <div className="text-right">MD%</div>
            <div className="text-right">STR%</div>
          </div>
          {summaries.slice(0, 12).map((s) => (
            <div
              key={s.subTypeKey}
              className="grid grid-cols-[1fr_120px_80px_64px_64px_64px] items-center gap-2 rounded-md px-2 py-1.5 hover:bg-[var(--color-surface-alt,#f8fafc)]"
            >
              <div className="flex min-w-0 items-center gap-2">
                <div
                  className="truncate text-[12px] font-medium"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {prettifyKey(s.subTypeKey)}
                </div>
                <div
                  className="h-1.5 flex-1 overflow-hidden rounded-full"
                  style={{ background: 'var(--color-surface-alt, #f1f5f9)', minWidth: 40 }}
                >
                  <div
                    className="h-full"
                    style={{
                      width: `${max > 0 ? (s.netSalesValue / max) * 100 : 0}%`,
                      background: 'linear-gradient(90deg, #60a5fa, #2176ff)',
                    }}
                  />
                </div>
              </div>
              <div className="text-right text-[12px] font-semibold tabular-nums" style={{ color: 'var(--color-text-primary)' }}>
                {fmtMoneyCompact(s.netSalesValue)}
              </div>
              <div className="text-right text-[12px] tabular-nums" style={{ color: 'var(--color-text-secondary)' }}>
                {fmtUnits(s.netSalesUnits)}
              </div>
              <div className="text-right text-[12px] font-medium tabular-nums" style={{ color: '#15803d' }}>
                {fmtPct(s.gpPct)}
              </div>
              <div className="text-right text-[12px] font-medium tabular-nums" style={{ color: '#b91c1c' }}>
                {fmtPct(s.markdownPct)}
              </div>
              <div className="text-right text-[12px] font-medium tabular-nums" style={{ color: 'var(--color-text-secondary)' }}>
                {fmtPct(s.strPct)}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex h-[200px] items-center justify-center text-[12px]"
      style={{ color: 'var(--color-text-tertiary)' }}
    >
      {children}
    </div>
  );
}

// ── Aggregation ────────────────────────────────────────────────────────────

function aggregateBySubType(rows: SalesAttributeRow[]): SubTypeSummary[] {
  const totals = new Map<string, {
    value: number; units: number;
    md: number; gp: number;
    grossValue: number; grossUnits: number;
  }>();
  for (const r of rows) {
    const cur = totals.get(r.subTypeKey) ?? {
      value: 0, units: 0, md: 0, gp: 0, grossValue: 0, grossUnits: 0,
    };
    cur.value += r.value;
    cur.units += r.units;
    cur.md += r.markdownValue;
    cur.gp += r.gpValue;
    // Attribute rows don't ship gross separately — approximate gross as value + md
    // and gross units as units (a small simplification, OK for ranking).
    cur.grossValue += r.value + r.markdownValue;
    cur.grossUnits += r.units;
    totals.set(r.subTypeKey, cur);
  }
  const grand = Array.from(totals.values()).reduce((a, b) => a + b.value, 0) || 1;
  const out: SubTypeSummary[] = [];
  for (const [k, t] of totals) {
    out.push({
      subTypeKey: k,
      netSalesValue: t.value,
      netSalesUnits: t.units,
      gpPct: t.value > 0 ? (t.gp / t.value) * 100 : 0,
      markdownPct: t.grossValue > 0 ? (t.md / t.grossValue) * 100 : 0,
      // STR proxy — sub-types don't carry EOM separately; use the per-row STR
      // average weighted by value, which is the data we have.
      strPct: 0,
      sharePct: (t.value / grand) * 100,
    });
  }
  // Re-compute weighted STR from raw rows (separate pass).
  const strNum = new Map<string, number>();
  const strDen = new Map<string, number>();
  for (const r of rows) {
    strNum.set(r.subTypeKey, (strNum.get(r.subTypeKey) ?? 0) + r.strPct * r.value);
    strDen.set(r.subTypeKey, (strDen.get(r.subTypeKey) ?? 0) + r.value);
  }
  for (const s of out) {
    const den = strDen.get(s.subTypeKey) ?? 0;
    s.strPct = den > 0 ? (strNum.get(s.subTypeKey) ?? 0) / den : 0;
  }
  return out.sort((a, b) => b.netSalesValue - a.netSalesValue);
}

function prettifyKey(key: string): string {
  // `cotton_jersey` → `Cotton Jersey`
  return key
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
