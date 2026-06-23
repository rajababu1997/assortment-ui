/**
 * Step 1 Historical Lens — the OTB Planning side panel.
 *
 * Anchors the planner's forecast in last year's same-month performance
 * for the selected brand × category list. Composes the dashboard
 * primitives in a single column suitable for a side drawer.
 */

import { useMemo } from 'react';
import { findBrand, findCategory } from '../../mockData/brands';
import {
  aggregateMonth,
  findRowsForMonth,
  findRowsRange,
  topBottomSellers,
} from '../../mockData/historicalSales';
import { fmtMoneyCompact } from '../../utils/format';
import type { BaseCurrency } from '@/features/setup/types';
import type { HistoryRow } from '../../mockData/historicalSales';
import { HistoryKpiStrip } from './HistoryKpiStrip';
import { Sparkline } from './Sparkline';
import { BrandHeatmap } from './BrandHeatmap';
import { WinnersLosersList } from './WinnersLosersList';
import { AiInsightPanel, type Insight } from './AiInsightPanel';

const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

interface Props {
  /** ISO start of the period the planner is currently working on. */
  periodStartIso: string;
  /** The brand × category pairs currently selected on the active tab. */
  selectedPairs: Array<{ brand_uuid: string; category_uuid: string }>;
  /** Optional planner draft total for the period (to drive comparison signals). */
  plannerDraftSales?: number;
  currency: BaseCurrency;
  /** Called when planner clicks a winner / loser card. */
  onSelectPair?: (brandUuid: string, categoryUuid: string) => void;
}

export function HistoricalLensPanel({
  periodStartIso,
  selectedPairs,
  plannerDraftSales,
  currency,
  onSelectPair,
}: Props) {
  const periodDate = new Date(periodStartIso);
  const currentYear = periodDate.getFullYear();
  const currentMonth = periodDate.getMonth();
  const lastYear = currentYear - 1;
  const twoYearsAgo = currentYear - 2;

  const filter = useMemo(() => {
    if (selectedPairs.length === 0) return null;
    return {
      brand_uuids: Array.from(new Set(selectedPairs.map((p) => p.brand_uuid))),
      category_uuids: selectedPairs.map((p) => p.category_uuid),
    };
  }, [selectedPairs]);

  const lyRows = useMemo(
    () =>
      findRowsForMonth({
        year: lastYear,
        month: currentMonth,
        ...(filter ?? {}),
      }),
    [lastYear, currentMonth, filter],
  );

  const ly2Rows = useMemo(
    () =>
      findRowsForMonth({
        year: twoYearsAgo,
        month: currentMonth,
        ...(filter ?? {}),
      }),
    [twoYearsAgo, currentMonth, filter],
  );

  const lyAgg = aggregateMonth(lyRows);
  const ly2Agg = aggregateMonth(ly2Rows);

  const yoyDeltaPct = ly2Agg.net_sales > 0
    ? ((lyAgg.net_sales - ly2Agg.net_sales) / ly2Agg.net_sales) * 100
    : null;

  const sparkSeries = useMemo(() => {
    const rows = findRowsRange(
      twoYearsAgo,
      0,
      lastYear,
      11,
      filter?.brand_uuids,
      filter?.category_uuids,
    );
    const grouped = new Map<string, number>();
    rows.forEach((r) => {
      const key = `${r.year}-${r.month}`;
      grouped.set(key, (grouped.get(key) ?? 0) + r.net_sales);
    });
    const months: number[] = [];
    for (let y = twoYearsAgo; y <= lastYear; y++) {
      for (let m = 0; m < 12; m++) {
        months.push(grouped.get(`${y}-${m}`) ?? 0);
      }
    }
    return months;
  }, [twoYearsAgo, lastYear, filter]);

  // Index in the sparkline for the comparison month (last-year cell)
  const highlightIdx = 12 + currentMonth;

  const { winners, losers } = useMemo(
    () => topBottomSellers(lastYear, currentMonth, 5),
    [lastYear, currentMonth],
  );

  const insights = useMemo(
    () => generateInsights({ lyAgg, ly2Agg, yoyDeltaPct, plannerDraftSales, lyRows, currentMonth }),
    [lyAgg, ly2Agg, yoyDeltaPct, plannerDraftSales, lyRows, currentMonth],
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Header / context strip */}
      <div className="flex flex-col gap-1">
        <div className="text-xs text-[var(--color-text-tertiary)]">Comparing against</div>
        <div className="text-sm font-semibold">
          {MONTH_LABELS[currentMonth]} {lastYear} ·{' '}
          <span className="text-[var(--color-text-secondary)] font-normal">
            {filter
              ? `${selectedPairs.length} brand × category${selectedPairs.length === 1 ? '' : 's'} on this tab`
              : 'Whole catalogue (no rows picked yet)'}
          </span>
        </div>
      </div>

      <HistoryKpiStrip
        currency={currency}
        netSalesLY={lyAgg.net_sales}
        yoyDeltaPct={yoyDeltaPct}
        markdownPct={lyAgg.markdown_pct}
        sellThroughPct={lyAgg.sell_through_pct}
        grossMarginPct={lyAgg.gross_margin_pct}
      />

      <div className="rounded border border-[var(--color-divider)] p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-semibold">24-month trend</div>
          <div className="text-[10px] text-[var(--color-text-tertiary)]">
            {twoYearsAgo} – {lastYear}
          </div>
        </div>
        <Sparkline values={sparkSeries} width={300} height={48} highlightIndex={highlightIdx} />
        <div className="text-[10px] text-[var(--color-text-tertiary)] mt-1">
          Peak: {fmtMoneyCompact(Math.max(...sparkSeries), currency)} · Avg:{' '}
          {fmtMoneyCompact(
            sparkSeries.reduce((s, v) => s + v, 0) / Math.max(1, sparkSeries.length),
            currency,
          )}
        </div>
      </div>

      <AiInsightPanel insights={insights} />

      <BrandHeatmap comparisonYear={lastYear} highlightMonth={currentMonth} />

      <div
        onClickCapture={(e) => {
          if (!onSelectPair) return;
          const target = e.target as HTMLElement;
          const li = target.closest('li[data-brand]') as HTMLLIElement | null;
          if (li) onSelectPair(li.dataset.brand!, li.dataset.category!);
        }}
      >
        <WinnersLosersList winners={winners} losers={losers} currency={currency} />
        {onSelectPair && (
          <div className="mt-1 text-[10px] text-[var(--color-text-tertiary)] italic">
            Tip: click any winner / loser row to add that brand × category to this tab.
          </div>
        )}
      </div>

      <div className="text-[10px] text-[var(--color-text-tertiary)] italic">
        Historical numbers are demo-stubbed. In production they come from the sales + inventory feed.
      </div>
    </div>
  );
}

function generateInsights(args: {
  lyAgg: ReturnType<typeof aggregateMonth>;
  ly2Agg: ReturnType<typeof aggregateMonth>;
  yoyDeltaPct: number | null;
  plannerDraftSales: number | undefined;
  lyRows: HistoryRow[];
  currentMonth: number;
}): Insight[] {
  const { lyAgg, ly2Agg, yoyDeltaPct, plannerDraftSales, lyRows, currentMonth } = args;
  const out: Insight[] = [];

  // Seasonality call-out
  const FESTIVE = [9, 10, 11]; // Oct/Nov/Dec
  if (FESTIVE.includes(currentMonth)) {
    out.push({
      tone: 'positive',
      message: `${MONTH_LABELS[currentMonth]} is a peak festive month — historically does ~25–30% above baseline. Plan inventory generously.`,
    });
  } else if ([0, 1].includes(currentMonth)) {
    out.push({
      tone: 'warning',
      message: `${MONTH_LABELS[currentMonth]} is a post-festive lean month — sell-through dips. Trim EOM to protect margin.`,
    });
  }

  // Trend signal
  if (yoyDeltaPct != null) {
    if (yoyDeltaPct >= 8) {
      out.push({
        tone: 'positive',
        message: `Last year same period grew +${yoyDeltaPct.toFixed(1)}% YoY. Carry that growth into your forecast unless trend has shifted.`,
      });
    } else if (yoyDeltaPct <= -5) {
      out.push({
        tone: 'warning',
        message: `Last year was ${yoyDeltaPct.toFixed(1)}% YoY. Forecast cautiously — investigate the dip first.`,
      });
    }
  }

  // Markdown call-out
  if (lyAgg.markdown_pct > 15) {
    out.push({
      tone: 'warning',
      message: `Last year markdowns hit ${lyAgg.markdown_pct.toFixed(1)}% — above the healthy 10–15% band. Tighten EOM and avoid over-buying.`,
    });
  }

  // Planner vs last-year quick check
  if (plannerDraftSales != null && lyAgg.net_sales > 0) {
    const delta = ((plannerDraftSales - lyAgg.net_sales) / lyAgg.net_sales) * 100;
    if (Math.abs(delta) >= 15) {
      out.push({
        tone: delta > 0 ? 'info' : 'warning',
        message: `Your draft sales for this period are ${delta > 0 ? '+' : ''}${delta.toFixed(1)}% vs last year. ${
          delta > 0
            ? 'Make sure the growth story holds — pricing? distribution?'
            : 'Cutting forecast is fine if you know why — otherwise this leaves money on the table.'
        }`,
      });
    }
  }

  // Top performer hint
  if (lyRows.length > 0) {
    const top = [...lyRows].sort((a, b) => b.net_sales - a.net_sales)[0];
    const brand = findBrand(top.brand_uuid);
    const cat = findCategory(top.category_uuid);
    if (brand && cat) {
      out.push({
        tone: 'info',
        message: `Top performer last ${MONTH_LABELS[currentMonth]}: ${brand.name} × ${cat.name} (₹${(top.net_sales / 100000).toFixed(0)}L, ST ${top.sell_through_pct.toFixed(0)}%). Protect its OTB share.`,
      });
    }
  }

  return out.slice(0, 4);
}
