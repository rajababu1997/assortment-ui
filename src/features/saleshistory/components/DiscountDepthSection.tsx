/**
 * Discount-depth distribution — what % of revenue is sold at each
 * markdown bucket?
 *
 * The MD% headline tells you the average. This tile tells you the
 * *shape*. A buyer with 20% avg MD might be running half their book at
 * 0% and the other half at 40% — that's a very different problem from a
 * uniform 20% across the whole book.
 *
 * Buckets (cumulative slice of markdown vs MRP):
 *   • Full price  — 0–5%   (healthy launches / EOLs)
 *   • Light       — 5–15%  (festive / clearance light)
 *   • Mid         — 15–25% (typical end-of-season)
 *   • Deep        — 25–40% (aggressive)
 *   • Distress    — 40%+   (fire sale)
 */

import { useMemo } from 'react';
import { Percent } from 'lucide-react';
import { useSalesAggregate } from '@/features/sales/useSales';
import type { SalesAggregateRow } from '@/features/sales/types';
import { fmtMoneyCompact, fmtPct } from '../format';
import { HEADER_BG } from './cardStyle';
import { SectionInfoButton } from './SectionInfoButton';
import type { DashboardFilters } from '../useDashboardFilters';

type Bucket = 'full' | 'light' | 'mid' | 'deep' | 'distress';
const BUCKET_ORDER: Bucket[] = ['full', 'light', 'mid', 'deep', 'distress'];
const BUCKET_LABEL: Record<Bucket, string> = {
  full:     'Full price',
  light:    'Light',
  mid:      'Mid',
  deep:     'Deep',
  distress: 'Distress',
};
const BUCKET_RANGE: Record<Bucket, string> = {
  full:     '0–5%',
  light:    '5–15%',
  mid:      '15–25%',
  deep:     '25–40%',
  distress: '40%+',
};
const BUCKET_COLOR: Record<Bucket, string> = {
  full:     '#15803d',
  light:    '#84cc16',
  mid:      '#f59e0b',
  deep:     '#ea580c',
  distress: '#b91c1c',
};

interface BucketRow {
  bucket: Bucket;
  revenue: number;
  sharePct: number;
}

export function DiscountDepthSection({ filters }: { filters: DashboardFilters }) {
  const { data: rows = [], isLoading } = useSalesAggregate({
    brand: filters.brands,
    category: filters.categories,
    from: filters.from,
    to: filters.to,
  });

  const { buckets, totalRevenue, weightedMd } = useMemo(
    () => bucketise(rows),
    [rows],
  );

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
          <Percent size={14} style={{ color: 'var(--color-primary)' }} />
          <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Discount depth distribution
          </h3>
          <SectionInfoButton title="Discount depth distribution">
            <p>What percentage of your revenue is sold at each markdown depth?</p>
            <p className="mt-2">
              The Markdown headline tells you the average. This view tells you the <em>shape</em>. A 20% average MD could
              mean half your sales went at 0% off and the other half at 40% — a very different problem from uniform 20%
              across the line.
            </p>
            <p className="mt-3"><strong>Buckets</strong> (markdown vs MRP):</p>
            <ul className="mt-1 list-disc space-y-1 pl-5">
              <li>🟢 <strong>Full price</strong> 0–5% — fresh launches, healthy turnover.</li>
              <li>🟡 <strong>Light</strong> 5–15% — festive lifts, tactical clearance.</li>
              <li>🟠 <strong>Mid</strong> 15–25% — typical end-of-season.</li>
              <li>🔴 <strong>Deep</strong> 25–40% — aggressive clearance.</li>
              <li>🟥 <strong>Distress</strong> 40%+ — fire sale.</li>
            </ul>
            <p className="mt-3">All filters apply. The header shows the weighted average MD% across all buckets.</p>
          </SectionInfoButton>
        </div>
        <div className="text-[11px]" style={{ color: 'var(--color-text-tertiary)' }}>
          revenue split by markdown bucket
        </div>
      </header>

      {isLoading || totalRevenue === 0 ? (
        <div
          className="flex h-[200px] items-center justify-center text-[12px]"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          {isLoading ? 'Loading markdown shape…' : 'No revenue to slice.'}
        </div>
      ) : (
        <div className="flex flex-col gap-3 p-3">
          {/* Stacked bar */}
          <div className="flex flex-col gap-1.5">
            <div
              className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              <span>Revenue distribution</span>
              <span className="tabular-nums">avg MD% {fmtPct(weightedMd)}</span>
            </div>
            <div
              className="flex h-3.5 w-full overflow-hidden rounded-md border"
              style={{ borderColor: 'var(--color-divider)' }}
            >
              {BUCKET_ORDER.map((b) => {
                const row = buckets.find((x) => x.bucket === b);
                if (!row || row.sharePct <= 0) return null;
                return (
                  <div
                    key={b}
                    style={{
                      width: `${row.sharePct}%`,
                      background: BUCKET_COLOR[b],
                    }}
                    title={`${BUCKET_LABEL[b]} (${BUCKET_RANGE[b]}): ${fmtPct(row.sharePct)} · ${fmtMoneyCompact(row.revenue)}`}
                  />
                );
              })}
            </div>
          </div>

          {/* Per-bucket detail rows */}
          <div className="flex flex-col gap-1">
            <div
              className="grid grid-cols-[120px_60px_1fr_100px_60px] items-center gap-2 px-2 text-[10px] font-semibold uppercase tracking-wider"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              <div>Bucket</div>
              <div>MD %</div>
              <div />
              <div className="text-right">Revenue</div>
              <div className="text-right">Share</div>
            </div>
            {BUCKET_ORDER.map((b) => {
              const row = buckets.find((x) => x.bucket === b) ?? { bucket: b, revenue: 0, sharePct: 0 };
              return (
                <div
                  key={b}
                  className="grid grid-cols-[120px_60px_1fr_100px_60px] items-center gap-2 rounded-md px-2 py-1.5"
                >
                  <div className="flex items-center gap-2">
                    <span
                      style={{
                        width: 10, height: 10, borderRadius: 3,
                        background: BUCKET_COLOR[b],
                        flexShrink: 0,
                      }}
                    />
                    <span className="text-[12px] font-medium" style={{ color: 'var(--color-text-primary)' }}>
                      {BUCKET_LABEL[b]}
                    </span>
                  </div>
                  <div
                    className="text-[11px] tabular-nums"
                    style={{ color: 'var(--color-text-tertiary)' }}
                  >
                    {BUCKET_RANGE[b]}
                  </div>
                  <div
                    className="h-1.5 overflow-hidden rounded-full"
                    style={{ background: 'var(--color-surface-alt, #f1f5f9)' }}
                  >
                    <div
                      className="h-full"
                      style={{
                        width: `${row.sharePct}%`,
                        background: BUCKET_COLOR[b],
                      }}
                    />
                  </div>
                  <div className="text-right text-[12px] font-semibold tabular-nums" style={{ color: 'var(--color-text-primary)' }}>
                    {fmtMoneyCompact(row.revenue)}
                  </div>
                  <div className="text-right text-[12px] font-medium tabular-nums" style={{ color: 'var(--color-text-secondary)' }}>
                    {fmtPct(row.sharePct)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

function bucketise(rows: SalesAggregateRow[]): {
  buckets: BucketRow[];
  totalRevenue: number;
  weightedMd: number;
} {
  const tot: Record<Bucket, number> = { full: 0, light: 0, mid: 0, deep: 0, distress: 0 };
  let mdNum = 0;
  let mdDen = 0;
  for (const r of rows) {
    const md = r.markdownPct;
    const rev = r.netSalesValue;
    if (rev <= 0) continue;
    tot[bucketForMd(md)] += rev;
    mdNum += md * rev;
    mdDen += rev;
  }
  const totalRevenue = BUCKET_ORDER.reduce((a, b) => a + tot[b], 0);
  const buckets: BucketRow[] = BUCKET_ORDER.map((b) => ({
    bucket: b,
    revenue: tot[b],
    sharePct: totalRevenue > 0 ? (tot[b] / totalRevenue) * 100 : 0,
  }));
  return {
    buckets,
    totalRevenue,
    weightedMd: mdDen > 0 ? mdNum / mdDen : 0,
  };
}

function bucketForMd(md: number): Bucket {
  if (md < 5)   return 'full';
  if (md < 15)  return 'light';
  if (md < 25)  return 'mid';
  if (md < 40)  return 'deep';
  return 'distress';
}
