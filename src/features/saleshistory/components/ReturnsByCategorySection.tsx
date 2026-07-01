/**
 * Returns by Category — which categories the customer keeps sending back.
 *
 * Ranked desc by Returns ₹. The rate column (Returns %) is weighted
 * (sum(returnsValue) / sum(grossSalesValue)) — a proper aggregate, not
 * the wrong "mean of row pcts".
 *
 * Like the Pareto, this is a discovery widget — period-only filter so
 * the whole returns picture stays visible even when the buyer drills
 * into one brand elsewhere.
 */

import { useMemo } from 'react';
import { Undo2 } from 'lucide-react';
import { useSalesAggregate } from '@/features/sales/useSales';
import { useApiCategories } from '@/features/otb/useOtbMaster';
import type { SalesAggregateRow } from '@/features/sales/types';
import { fmtMoneyCompact, fmtPct, fmtUnits } from '../format';
import { HEADER_BG } from './cardStyle';
import { SectionInfoButton } from './SectionInfoButton';
import type { DashboardFilters } from '../useDashboardFilters';

interface NameOpt { uuid: string; name: string }

interface ReturnsRow {
  uuid: string;
  name: string;
  returnsValue: number;
  returnsUnits: number;
  returnsPct: number;
  sharePct: number;
}

export function ReturnsByCategorySection({ filters }: { filters: DashboardFilters }) {
  const { data: rows = [], isLoading } = useSalesAggregate({
    brand: filters.brands,
    category: filters.categories,
    from: filters.from,
    to: filters.to,
  });
  const { data: cats = [] } = useApiCategories() as { data?: NameOpt[] };

  const { ranked, totalReturns, weightedReturnsPct } = useMemo(
    () => aggregateReturns(rows, cats),
    [rows, cats],
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
          <Undo2 size={14} style={{ color: 'var(--color-primary)' }} />
          <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Returns by Category
          </h3>
          <SectionInfoButton title="Returns by Category">
            <p>Which categories your customers keep sending back, ranked by total <strong>Returns ₹</strong>.</p>
            <p className="mt-3"><strong>Columns:</strong></p>
            <ul className="mt-1 list-disc space-y-1 pl-5">
              <li><strong>Returns ₹</strong> — total return value for the category in the period.</li>
              <li><strong>Returns u</strong> — return units.</li>
              <li><strong>Rate</strong> — return value as a percentage of gross sales. Coloured red at 10%+, amber at 7%+.</li>
              <li><strong>Share</strong> — what % of total returns this category accounts for.</li>
            </ul>
            <p className="mt-3">All filters apply.</p>
            <p className="mt-3">
              A high Rate with low Share = a niche quality issue worth investigating. A high Share with a normal Rate = a
              volume effect, worth watching but not urgent.
            </p>
          </SectionInfoButton>
        </div>
        {totalReturns > 0 && (
          <div className="text-[11px] tabular-nums" style={{ color: 'var(--color-text-tertiary)' }}>
            total {fmtMoneyCompact(totalReturns)} · avg rate {fmtPct(weightedReturnsPct)}
          </div>
        )}
      </header>

      {isLoading ? (
        <Empty>Loading returns…</Empty>
      ) : ranked.length === 0 ? (
        <Empty>No returns in this period.</Empty>
      ) : (
        <div className="flex flex-col gap-1 p-3">
          <div
            className="grid grid-cols-[1fr_120px_80px_72px_72px] items-center gap-2 px-2 text-[10px] font-semibold uppercase tracking-wider"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            <div>Category</div>
            <div className="text-right">Returns ₹</div>
            <div className="text-right">Returns u</div>
            <div className="text-right">Rate</div>
            <div className="text-right">Share</div>
          </div>
          {ranked.map((r) => (
            <div
              key={r.uuid}
              className="grid grid-cols-[1fr_120px_80px_72px_72px] items-center gap-2 rounded-md px-2 py-1.5 hover:bg-[var(--color-surface-alt,#f8fafc)]"
            >
              <div className="flex min-w-0 items-center gap-2">
                <div
                  className="truncate text-[12px] font-medium"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {r.name}
                </div>
                <div
                  className="h-1.5 flex-1 overflow-hidden rounded-full"
                  style={{ background: 'var(--color-surface-alt, #f1f5f9)', minWidth: 40 }}
                >
                  <div
                    className="h-full"
                    style={{
                      width: `${r.sharePct}%`,
                      background: 'linear-gradient(90deg, #fda4af, #b91c1c)',
                    }}
                  />
                </div>
              </div>
              <div className="text-right text-[12px] font-semibold tabular-nums" style={{ color: 'var(--color-text-primary)' }}>
                {fmtMoneyCompact(r.returnsValue)}
              </div>
              <div className="text-right text-[12px] tabular-nums" style={{ color: 'var(--color-text-secondary)' }}>
                {fmtUnits(r.returnsUnits)}
              </div>
              <div
                className="text-right text-[12px] font-medium tabular-nums"
                style={{ color: r.returnsPct >= 10 ? '#b91c1c' : r.returnsPct >= 7 ? '#b45309' : 'var(--color-text-secondary)' }}
              >
                {fmtPct(r.returnsPct)}
              </div>
              <div className="text-right text-[12px] font-medium tabular-nums" style={{ color: 'var(--color-text-secondary)' }}>
                {fmtPct(r.sharePct)}
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
      className="flex h-[180px] items-center justify-center text-[12px]"
      style={{ color: 'var(--color-text-tertiary)' }}
    >
      {children}
    </div>
  );
}

function aggregateReturns(rows: SalesAggregateRow[], cats: NameOpt[]): {
  ranked: ReturnsRow[];
  totalReturns: number;
  weightedReturnsPct: number;
} {
  const tot = new Map<string, { rv: number; ru: number; gross: number }>();
  for (const r of rows) {
    const cur = tot.get(r.categoryUuid) ?? { rv: 0, ru: 0, gross: 0 };
    cur.rv += r.returnsValue;
    cur.ru += r.returnsUnits;
    cur.gross += r.grossSalesValue;
    tot.set(r.categoryUuid, cur);
  }
  const totalReturns = Array.from(tot.values()).reduce((a, b) => a + b.rv, 0);
  const totalGross = Array.from(tot.values()).reduce((a, b) => a + b.gross, 0);
  const nameMap = new Map(cats.map((c) => [c.uuid, c.name]));
  const ranked: ReturnsRow[] = Array.from(tot.entries())
    .filter(([, v]) => v.rv > 0)
    .map(([uuid, v]) => ({
      uuid,
      name: nameMap.get(uuid) ?? uuid.slice(0, 8),
      returnsValue: v.rv,
      returnsUnits: v.ru,
      returnsPct: v.gross > 0 ? (v.rv / v.gross) * 100 : 0,
      sharePct: totalReturns > 0 ? (v.rv / totalReturns) * 100 : 0,
    }))
    .sort((a, b) => b.returnsValue - a.returnsValue);
  return {
    ranked,
    totalReturns,
    weightedReturnsPct: totalGross > 0 ? (totalReturns / totalGross) * 100 : 0,
  };
}
