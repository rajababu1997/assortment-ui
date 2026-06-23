/**
 * Step 1 / OTB-planning lens. Headline KPIs + 24-month trend + heat-map
 * + top winners / losers.
 */

import { useMemo } from 'react';
import { Card } from '@/components/primitives';
import { Sparkline } from '@/features/otb/components/dashboard/Sparkline';
import { WinnersLosersList } from '@/features/otb/components/dashboard/WinnersLosersList';
import { AiInsightPanel, type Insight } from '@/features/otb/components/dashboard/AiInsightPanel';
import { MonthlyDimensionBreakdown } from '../components/MonthlyDimensionBreakdown';
import { fmtMoneyCompact } from '@/features/otb/utils/format';
import { findBrand, findCategory } from '@/features/otb/mockData/brands';
import { KpiStrip } from '../components/KpiStrip';
import { aggregateTotals, queryRows, topBottomSellers, type HistoryRow } from '../mock/dataset';
import type { HistoryFilters } from '../useHistoryFilters';
import type { BaseCurrency } from '@/features/setup/types';

const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

interface Props {
  filters: HistoryFilters;
  compareRows: HistoryRow[];
  trailingRows: HistoryRow[];
  compareLabel: string;
  currency: BaseCurrency;
  onSelectPair?: (brandUuid: string, categoryUuid: string) => void;
}

export function OverviewLens({
  filters,
  compareRows,
  trailingRows,
  compareLabel,
  currency,
  onSelectPair,
}: Props) {
  const compareAgg = useMemo(() => aggregateTotals(compareRows), [compareRows]);

  // YoY delta relative to (anchor - 2y) same window
  const yoyDeltaPct = useMemo(() => {
    const prevYear = filters.anchorYear - 2;
    const rows = queryRows({
      yearFrom: prevYear,
      monthFrom: filters.anchorMonth,
      yearTo: prevYear,
      monthTo: filters.anchorMonth,
      brand_uuids: filters.brand_uuids,
      category_uuids: filters.category_uuids,
    });
    const prevAgg = aggregateTotals(rows);
    if (prevAgg.net_sales === 0) return null;
    return ((compareAgg.net_sales - prevAgg.net_sales) / prevAgg.net_sales) * 100;
  }, [filters, compareAgg.net_sales]);

  const sparkSeries = useMemo(() => {
    const map = new Map<string, number>();
    trailingRows.forEach((r) => {
      const k = `${r.year}-${r.month}`;
      map.set(k, (map.get(k) ?? 0) + r.net_sales);
    });
    const out: number[] = [];
    const startIdx = filters.anchorYear * 12 + filters.anchorMonth - 23;
    for (let i = 0; i < 24; i++) {
      const idx = startIdx + i;
      const year = Math.floor(idx / 12);
      const month = ((idx % 12) + 12) % 12;
      out.push(map.get(`${year}-${month}`) ?? 0);
    }
    return out;
  }, [trailingRows, filters.anchorYear, filters.anchorMonth]);

  const { winners, losers } = useMemo(() => topBottomSellers(compareRows, 5), [compareRows]);

  const insights = useMemo<Insight[]>(() => buildInsights(compareAgg, yoyDeltaPct, filters.anchorMonth, winners), [
    compareAgg,
    yoyDeltaPct,
    filters.anchorMonth,
    winners,
  ]);

  return (
    <div className="flex flex-col gap-4">
      <KpiStrip
        currency={currency}
        compare={compareAgg}
        compareLabel={compareLabel}
        yoyDeltaPct={yoyDeltaPct}
      />

      <Card>
        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-semibold">24-month sales trend</div>
            <div className="text-[10px] text-[var(--color-text-tertiary)]">
              Peak {fmtMoneyCompact(Math.max(...sparkSeries), currency)} · Avg{' '}
              {fmtMoneyCompact(sparkSeries.reduce((s, v) => s + v, 0) / Math.max(1, sparkSeries.length), currency)}
            </div>
          </div>
          <Sparkline values={sparkSeries} width={680} height={56} highlightIndex={sparkSeries.length - 1} />
        </div>
      </Card>

      <AiInsightPanel insights={insights} />

      <MonthlyDimensionBreakdown
        rows={trailingRows}
        dimension="brand"
        numMonths={12}
        anchorYear={filters.anchorYear}
        anchorMonth={filters.anchorMonth}
        currency={currency}
        title="Monthly sales by brand"
        subtitle="Last 12 months ending at the anchor — cell shade reflects relative volume"
      />

      <MonthlyDimensionBreakdown
        rows={trailingRows}
        dimension="category"
        numMonths={12}
        anchorYear={filters.anchorYear}
        anchorMonth={filters.anchorMonth}
        currency={currency}
        title="Monthly sales by category"
        subtitle="Last 12 months ending at the anchor — categories ranked by contribution"
      />

      <div onClickCapture={(e) => {
        const target = e.target as HTMLElement;
        const li = target.closest('li[data-brand]') as HTMLLIElement | null;
        if (li && onSelectPair) {
          onSelectPair(li.dataset.brand!, li.dataset.category!);
        }
      }}>
        <WinnersLosersList winners={winners} losers={losers} currency={currency} />
      </div>
    </div>
  );
}

function buildInsights(
  agg: ReturnType<typeof aggregateTotals>,
  yoyDeltaPct: number | null,
  anchorMonth: number,
  winners: HistoryRow[],
): Insight[] {
  const out: Insight[] = [];
  if ([9, 10, 11].includes(anchorMonth)) {
    out.push({ tone: 'positive', message: `${MONTH_LABELS[anchorMonth]} is a peak festive month historically. Plan generously.` });
  } else if ([0, 1].includes(anchorMonth)) {
    out.push({ tone: 'warning', message: `${MONTH_LABELS[anchorMonth]} is a post-festive lean month. Trim EOM to protect margin.` });
  }
  if (yoyDeltaPct != null) {
    if (yoyDeltaPct >= 8) {
      out.push({ tone: 'positive', message: `Sales grew +${yoyDeltaPct.toFixed(1)}% YoY for this period. Carry that trend into the forecast.` });
    } else if (yoyDeltaPct <= -5) {
      out.push({ tone: 'warning', message: `Sales fell ${yoyDeltaPct.toFixed(1)}% YoY. Investigate the drop before re-betting at the same level.` });
    }
  }
  if (agg.markdown_pct > 16) {
    out.push({ tone: 'warning', message: `Markdown was ${agg.markdown_pct.toFixed(1)}% — pricing or buying ran hot. Tighten EOM cover this round.` });
  }
  if (winners.length > 0) {
    const w = winners[0];
    const brand = findBrand(w.brand_uuid);
    const cat = findCategory(w.category_uuid);
    if (brand && cat) {
      out.push({
        tone: 'info',
        message: `Top performer: ${brand.name} × ${cat.name} (ST ${w.sell_through_pct.toFixed(0)}%). Protect its OTB share.`,
      });
    }
  }
  return out.slice(0, 4);
}
