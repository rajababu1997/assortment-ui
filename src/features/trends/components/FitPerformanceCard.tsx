/**
 * Fit Performance — table only. Real data via useSalesAttribute (fit).
 */

import { Layers } from 'lucide-react';
import { SectionCard } from './SectionCard';
import { RecommendationChip } from './RecommendationChip';
import { DeltaBadge } from './DeltaBadge';
import { classifyAttribute } from '../utils/aiInsights';
import type { AttributePerf } from '../useTrendData';

interface Props {
  rows: AttributePerf[];
  isLoading: boolean;
}

export function FitPerformanceCard({ rows, isLoading }: Props) {
  const top = rows.slice(0, 6);
  return (
    <SectionCard title="Fit Performance" icon={Layers}>
      {isLoading ? (
        <div className="h-[220px] animate-pulse rounded-md"
          style={{ background: 'var(--color-surface-alt, #f1f5f9)' }} />
      ) : top.length === 0 ? (
        <div className="flex h-[180px] items-center justify-center text-[12px]"
          style={{ color: 'var(--color-text-tertiary)' }}>
          No fit-level attribute data
        </div>
      ) : (
        <table className="w-full text-[11.5px]">
          <thead>
            <tr style={{ color: 'var(--color-text-tertiary)' }}>
              <Th align="left">Fit</Th>
              <Th>Sales %</Th>
              <Th>Growth vs LY</Th>
              <Th>GP%</Th>
              <Th>Sell Through</Th>
              <Th align="left">AI Recommendation</Th>
            </tr>
          </thead>
          <tbody>
            {top.map((r) => (
              <tr key={r.key} className="border-t"
                style={{ borderColor: 'var(--color-divider)' }}>
                <Td align="left">
                  <span className="font-medium"
                    style={{ color: 'var(--color-text-primary)' }}>
                    {r.label}
                  </span>
                </Td>
                <Td>{r.salesPct.toFixed(0)}%</Td>
                <Td><DeltaBadge value={r.growthVsLy} /></Td>
                <Td>{r.gpPct.toFixed(0)}%</Td>
                <Td>{r.strPct.toFixed(0)}%</Td>
                <Td align="left">
                  <RecommendationChip label={classifyAttribute(r)} />
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
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
