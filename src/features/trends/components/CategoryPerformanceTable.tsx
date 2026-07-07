/**
 * Performance by Category — real data via useSalesAggregate rolled up by
 * categoryUuid. Paginates client-side; sorted by Net Sales desc.
 */

import { useState } from 'react';
import { Grid2X2, ChevronLeft, ChevronRight } from 'lucide-react';
import { SectionCard } from './SectionCard';
import { RecommendationChip } from './RecommendationChip';
import { DeltaBadge } from './DeltaBadge';
import { classifyCategory } from '../utils/aiInsights';
import { fmtMoney, fmtUnits } from '../utils/format';
import type { CategoryPerf } from '../useTrendData';

const PAGE_SIZE = 6;

interface Props {
  rows: CategoryPerf[];
  isLoading: boolean;
}

export function CategoryPerformanceTable({ rows, isLoading }: Props) {
  const [page, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const visible = rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const from = rows.length ? page * PAGE_SIZE + 1 : 0;
  const to = Math.min((page + 1) * PAGE_SIZE, rows.length);

  return (
    <SectionCard
      title="Performance by Category"
      icon={Grid2X2}
    >
      {isLoading ? (
        <div className="h-[220px] animate-pulse rounded-md"
          style={{ background: 'var(--color-surface-alt, #f1f5f9)' }} />
      ) : (
        <>
          <table className="w-full text-[11.5px]">
            <thead>
              <tr style={{ color: 'var(--color-text-tertiary)' }}>
                <Th align="left">Category</Th>
                <Th>Net Sales (₹)</Th>
                <Th>Units Sold</Th>
                <Th>GP%</Th>
                <Th>Sell Through</Th>
                <Th>Growth vs LY</Th>
                <Th>AI Recommendation</Th>
              </tr>
            </thead>
            <tbody>
              {visible.map((c) => (
                <tr key={c.categoryUuid} className="border-t"
                  style={{ borderColor: 'var(--color-divider)' }}>
                  <Td align="left">
                    <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                      {c.name}
                    </span>
                  </Td>
                  <Td>{fmtMoney(c.netSales)}</Td>
                  <Td>{fmtUnits(c.netSalesUnits)}</Td>
                  <Td>{c.gpPct.toFixed(0)}%</Td>
                  <Td>{c.strPct.toFixed(0)}%</Td>
                  <Td><DeltaBadge value={c.growthVsLy} /></Td>
                  <Td ><RecommendationChip label={classifyCategory(c)} /></Td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <Td align="left">
                    <span style={{ color: 'var(--color-text-tertiary)' }}>No category rollup yet.</span>
                  </Td>
                  <Td>—</Td><Td>—</Td><Td>—</Td><Td>—</Td><Td>—</Td>
                  <Td align="left">—</Td>
                </tr>
              )}
            </tbody>
          </table>

          {rows.length > PAGE_SIZE && (
            <div className="mt-2 flex items-center justify-between border-t pt-2 text-[10.5px]"
              style={{ borderColor: 'var(--color-divider)', color: 'var(--color-text-tertiary)' }}>
              <span>{from}-{to} of {rows.length}</span>
              <div className="flex items-center gap-1">
                <PagerBtn
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  Icon={ChevronLeft}
                />
                <PagerBtn
                  disabled={page >= pages - 1}
                  onClick={() => setPage((p) => Math.min(pages - 1, p + 1))}
                  Icon={ChevronRight}
                />
              </div>
            </div>
          )}
        </>
      )}
    </SectionCard>
  );
}

function Th({ children, align = 'right' }: { children: React.ReactNode; align?: 'left' | 'right' }) {
  return (
    <th className="pb-1.5 text-[10px] font-semibold uppercase tracking-[0.10em]"
      style={{ textAlign: align }}>
      {children}
    </th>
  );
}
function Td({ children, align = 'right' }: { children: React.ReactNode; align?: 'left' | 'right' }) {
  return (
    <td className="py-1 tabular-nums"
      style={{ textAlign: align, color: 'var(--color-text-secondary)' }}>
      {children}
    </td>
  );
}

function PagerBtn({
  Icon, onClick, disabled,
}: {
  Icon: typeof ChevronLeft;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex h-6 w-6 items-center justify-center rounded-md border transition-colors disabled:opacity-40"
      style={{
        borderColor: 'var(--color-divider)',
        color: 'var(--color-text-secondary)',
        background: 'var(--color-surface)',
      }}
    >
      <Icon size={12} />
    </button>
  );
}
