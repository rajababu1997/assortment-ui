/**
 * Occasion lens — auto-detects past + upcoming occasions touching the
 * release period and breaks each one into pre-event / during-event /
 * post-event weeks for the selected brand × category.
 */

import { useMemo } from 'react';
import { Alert } from '@/components/primitives';
import { AiInsightPanel, type Insight } from '@/features/otb/components/dashboard/AiInsightPanel';
import { fmtMoneyCompact } from '@/features/otb/utils/format';
import type { BaseCurrency } from '@/features/setup/types';
import {
  findOverlappingOccasions,
  findRampUpOccasions,
  getOccasionFamilyHistory,
  type Occasion,
} from '../../data/occasions';
import { aggregateWeekly, getWeeklyRange } from '../../data/weeklyVelocity';

interface Props {
  brand_uuid: string;
  category_uuid: string;
  periodStartIso: string;
  periodEndIso: string;
  currency: BaseCurrency;
}

function shiftIso(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function OccasionLensTab({
  brand_uuid, category_uuid, periodStartIso, periodEndIso, currency,
}: Props) {
  const occasions = useMemo(() => {
    const overlapping = findOverlappingOccasions(periodStartIso, periodEndIso);
    const ramping = findRampUpOccasions(periodEndIso, 60);
    const dedup = new Map<string, Occasion>();
    [...overlapping, ...ramping].forEach((o) => dedup.set(o.key, o));
    return Array.from(dedup.values()).sort(
      (a, b) => new Date(a.start_iso).getTime() - new Date(b.start_iso).getTime(),
    );
  }, [periodStartIso, periodEndIso]);

  if (occasions.length === 0) {
    return (
      <Alert severity="info">
        No festive or sale events touch this release period. Plan against trailing-velocity + LY anchors.
      </Alert>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {occasions.map((occ) => (
        <OccasionBlock
          key={occ.key}
          occasion={occ}
          brand_uuid={brand_uuid}
          category_uuid={category_uuid}
          currency={currency}
        />
      ))}
    </div>
  );
}

function OccasionBlock({
  occasion, brand_uuid, category_uuid, currency,
}: {
  occasion: Occasion;
  brand_uuid: string;
  category_uuid: string;
  currency: BaseCurrency;
}) {
  const history = useMemo(() => getOccasionFamilyHistory(occasion).slice(0, 3), [occasion]);

  return (
    <div className="rounded border border-[var(--color-divider)]">
      <div className="px-3 py-2 border-b border-[var(--color-divider)] flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="text-sm font-semibold">{occasion.label}</div>
          <div className="text-[10px] text-[var(--color-text-tertiary)]">
            Window: {occasion.start_iso} → {occasion.end_iso} · expected lift ~+{occasion.expected_lift_pct}%
          </div>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--color-primary)] text-white">
          Upcoming
        </span>
      </div>
      <div className="p-3 text-xs text-[var(--color-text-secondary)] italic border-b border-[var(--color-divider)]">
        {occasion.note}
      </div>

      {history.length === 0 ? (
        <div className="p-3 text-xs text-[var(--color-text-tertiary)] italic">
          No previous history in this family — first observation in the dataset.
        </div>
      ) : (
        <div className="p-3 flex flex-col gap-3">
          {history.map((past) => (
            <PastOccasionRow
              key={past.key}
              past={past}
              brand_uuid={brand_uuid}
              category_uuid={category_uuid}
              currency={currency}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PastOccasionRow({
  past, brand_uuid, category_uuid, currency,
}: {
  past: Occasion;
  brand_uuid: string;
  category_uuid: string;
  currency: BaseCurrency;
}) {
  const start = past.start_iso;
  const end = past.end_iso;

  const preCells = useMemo(
    () =>
      getWeeklyRange({
        brand_uuid,
        category_uuid,
        fromIso: shiftIso(start, -21),
        toIso: shiftIso(start, -1),
      }),
    [brand_uuid, category_uuid, start],
  );
  const duringCells = useMemo(
    () => getWeeklyRange({ brand_uuid, category_uuid, fromIso: start, toIso: end }),
    [brand_uuid, category_uuid, start, end],
  );
  const postCells = useMemo(
    () =>
      getWeeklyRange({
        brand_uuid,
        category_uuid,
        fromIso: shiftIso(end, 1),
        toIso: shiftIso(end, 21),
      }),
    [brand_uuid, category_uuid, end],
  );

  const pre = aggregateWeekly(preCells);
  const during = aggregateWeekly(duringCells);
  const post = aggregateWeekly(postCells);

  const insights = useMemo<Insight[]>(() => {
    const out: Insight[] = [];
    if (during.net_sales > 0 && pre.net_sales > 0) {
      const lift = ((during.net_sales / Math.max(1, pre.net_sales / Math.max(1, preCells.length)) - duringCells.length) / Math.max(1, duringCells.length)) * 100;
      if (lift > 30) {
        out.push({
          tone: 'positive',
          message: `Event window ran ~${lift.toFixed(0)}% above pre-event run-rate. Make sure stock is in DC at least 14 days prior.`,
        });
      }
    }
    if (post.avg_markdown_pct - during.avg_markdown_pct > 8) {
      out.push({
        tone: 'warning',
        message: `Post-event markdown jumped to ${post.avg_markdown_pct.toFixed(0)}% — over-buy risk. Trim EOM to avoid carry-over.`,
      });
    }
    return out.slice(0, 2);
  }, [pre, during, post, preCells.length, duringCells.length]);

  return (
    <div className="rounded border border-[var(--color-divider)] p-3 bg-[var(--color-bg-subtle)]">
      <div className="text-xs font-semibold mb-2">
        {past.label} {past.start_iso.slice(0, 4)} · {past.start_iso} → {past.end_iso}
      </div>
      <div className="grid grid-cols-3 gap-2 text-[11px]">
        <Stat label="Pre-event (T−21d)" sales={pre.net_sales} units={pre.units_sold} st={pre.avg_sell_through_pct} md={pre.avg_markdown_pct} currency={currency} />
        <Stat label="During event" sales={during.net_sales} units={during.units_sold} st={during.avg_sell_through_pct} md={during.avg_markdown_pct} currency={currency} highlight />
        <Stat label="Post-event (T+21d)" sales={post.net_sales} units={post.units_sold} st={post.avg_sell_through_pct} md={post.avg_markdown_pct} currency={currency} />
      </div>
      {insights.length > 0 && (
        <div className="mt-3">
          <AiInsightPanel insights={insights} />
        </div>
      )}
    </div>
  );
}

function Stat({
  label, sales, units, st, md, currency, highlight,
}: {
  label: string;
  sales: number;
  units: number;
  st: number;
  md: number;
  currency: BaseCurrency;
  highlight?: boolean;
}) {
  return (
    <div className={`rounded border p-2 ${highlight ? 'border-[var(--color-primary)] bg-[var(--color-bg-base)]' : 'border-[var(--color-divider)] bg-[var(--color-bg-base)]'}`}>
      <div className="text-[9px] uppercase tracking-wide text-[var(--color-text-tertiary)]">{label}</div>
      <div className="mt-0.5 font-semibold text-sm">{fmtMoneyCompact(sales, currency)}</div>
      <div className="text-[10px] text-[var(--color-text-secondary)]">
        {units.toLocaleString('en-IN')} u · ST {st.toFixed(0)}% · MD {md.toFixed(0)}%
      </div>
    </div>
  );
}
