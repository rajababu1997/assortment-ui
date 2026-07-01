/**
 * Anomaly banner — surfaces the single most notable thing in the slice.
 *
 * Pure heuristic ranking (no model). Each detector returns an `Anomaly`
 * with a severity; we sort by severity weight × magnitude and render the
 * top one as a thin coloured strip above the KPI tiles.
 *
 * Severity ladder:
 *   red    — needs attention now (stuck inventory, stockout cluster)
 *   amber  — keep an eye on it  (markdown creep, narrow-margin slide)
 *
 * Dismissed via component state — resets the moment any filter changes.
 */

import { useMemo, useState, useEffect } from 'react';
import { AlertOctagon, AlertTriangle, X } from 'lucide-react';
import { useSalesAggregate } from '@/features/sales/useSales';
import type { SalesAggregateRow } from '@/features/sales/types';
import { fmtPct } from '../format';
import type { DashboardFilters } from '../useDashboardFilters';

type Severity = 'red' | 'amber';

interface Anomaly {
  id: string;
  severity: Severity;
  /** Score for ranking — higher wins. Should be roughly comparable across kinds. */
  score: number;
  title: string;
  detail: string;
}

const SEVERITY_TONE: Record<Severity, { fg: string; bg: string; border: string; icon: React.ElementType }> = {
  red: {
    fg: '#b91c1c',
    bg: 'rgba(239,68,68,0.06)',
    border: '#dc2626',
    icon: AlertOctagon,
  },
  amber: {
    fg: '#b45309',
    bg: 'rgba(245,158,11,0.07)',
    border: '#f59e0b',
    icon: AlertTriangle,
  },
};

export function AnomalyBanner({ filters }: { filters: DashboardFilters }) {
  const [dismissed, setDismissed] = useState(false);

  // Reset dismissal when the slice changes — fresh slice deserves a fresh look.
  useEffect(() => {
    setDismissed(false);
  }, [filters.brands, filters.categories, filters.from, filters.to]);

  const { data: rows = [] } = useSalesAggregate({
    brand: filters.brands,
    category: filters.categories,
    from: filters.from,
    to: filters.to,
  });

  const anomaly = useMemo(() => detectAnomaly(rows, filters), [rows, filters]);

  if (!anomaly || dismissed) return null;

  const tone = SEVERITY_TONE[anomaly.severity];
  const Icon = tone.icon;

  return (
    <div
      className="flex items-center gap-3 rounded-lg border-l-4 px-3 py-2"
      style={{
        background: tone.bg,
        borderLeftColor: tone.border,
        border: '1px solid var(--color-divider)',
        borderLeftWidth: 4,
      }}
    >
      <Icon size={16} style={{ color: tone.fg, flexShrink: 0 }} />
      <div className="min-w-0 flex-1">
        <div
          className="text-[12px] font-semibold leading-tight"
          style={{ color: tone.fg }}
        >
          {anomaly.title}
        </div>
        <div
          className="mt-0.5 text-[11.5px] leading-snug"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {anomaly.detail}
        </div>
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md transition-colors hover:bg-[rgba(0,0,0,0.06)]"
        style={{ color: 'var(--color-text-tertiary)' }}
        title="Dismiss"
        aria-label="Dismiss anomaly"
      >
        <X size={12} />
      </button>
    </div>
  );
}

// ── Detection ──────────────────────────────────────────────────────────────

function detectAnomaly(rows: SalesAggregateRow[], filters: DashboardFilters): Anomaly | null {
  if (rows.length === 0) return null;
  const candidates: Anomaly[] = [];

  candidates.push(...detectStuckInventory(rows));
  candidates.push(...detectStockoutCluster(rows));
  candidates.push(...detectMarkdownCreep(rows, filters));

  if (candidates.length === 0) return null;
  return candidates.sort((a, b) => severityRank(b.severity) * b.score - severityRank(a.severity) * a.score)[0];
}

const severityRank = (s: Severity) => (s === 'red' ? 3 : s === 'amber' ? 2 : 1);

// Stuck inventory — % of (brand × cat × band) slices with weeksCover > 12,
// using only the latest period per slice (matches inventory-health rule).
function detectStuckInventory(rows: SalesAggregateRow[]): Anomaly[] {
  const lastByKey = new Map<string, SalesAggregateRow>();
  for (const r of rows) {
    const k = `${r.brandUuid}|${r.categoryUuid}|${r.bandId}`;
    const ex = lastByKey.get(k);
    if (!ex || r.periodKey > ex.periodKey) lastByKey.set(k, r);
  }
  const total = lastByKey.size;
  if (total < 4) return [];
  let stuck = 0;
  for (const r of lastByKey.values()) {
    if (r.eomUnits > 0 && r.weeksCover > 12) stuck += 1;
  }
  const pct = (stuck / total) * 100;
  if (pct < 25) return [];
  return [{
    id: 'stuck-inventory',
    severity: pct >= 40 ? 'red' : 'amber',
    score: pct,
    title: 'Stuck inventory',
    detail: `${fmtPct(pct)} of slices have over 12 weeks of cover — markdown risk if not actioned.`,
  }];
}

// Stockout cluster — total stockout days across the slice.
function detectStockoutCluster(rows: SalesAggregateRow[]): Anomaly[] {
  const total = rows.reduce((a, b) => a + b.stockoutDays, 0);
  if (total < 100) return [];
  return [{
    id: 'stockout-cluster',
    severity: total >= 500 ? 'red' : 'amber',
    score: Math.min(total / 5, 100),
    title: 'Stockout cluster',
    detail: `${total.toLocaleString('en-IN')} stockout days in this slice — review reorder windows.`,
  }];
}

// Markdown creep — last-third MD% vs first-third MD%.
function detectMarkdownCreep(rows: SalesAggregateRow[], filters: DashboardFilters): Anomaly[] {
  const months = enumerateMonths(filters.from, filters.to);
  if (months.length < 6) return [];
  const third = Math.floor(months.length / 3);
  const prior = new Set(months.slice(0, third));
  const recent = new Set(months.slice(months.length - third));

  let priorMd = 0, priorGross = 0;
  let recentMd = 0, recentGross = 0;
  for (const r of rows) {
    if (prior.has(r.periodKey)) {
      priorMd += r.markdownValue;
      priorGross += r.grossSalesValue;
    }
    if (recent.has(r.periodKey)) {
      recentMd += r.markdownValue;
      recentGross += r.grossSalesValue;
    }
  }
  if (priorGross === 0 || recentGross === 0) return [];
  const priorPct = (priorMd / priorGross) * 100;
  const recentPct = (recentMd / recentGross) * 100;
  const delta = recentPct - priorPct;
  if (delta < 4) return [];
  return [{
    id: 'markdown-creep',
    severity: delta >= 8 ? 'red' : 'amber',
    score: delta * 8,
    title: 'Markdown creep',
    detail: `MD% rising — recent ${third} months at ${fmtPct(recentPct)} vs first ${third} at ${fmtPct(priorPct)} (+${delta.toFixed(1)} pp).`,
  }];
}

function enumerateMonths(from: string, to: string): string[] {
  const [fy, fm] = from.split('-').map(Number);
  const [ty, tm] = to.split('-').map(Number);
  const out: string[] = [];
  let y = fy;
  let m = fm;
  while (y < ty || (y === ty && m <= tm)) {
    out.push(`${y}-${String(m).padStart(2, '0')}`);
    m += 1;
    if (m > 12) { m = 1; y += 1; }
  }
  return out;
}
