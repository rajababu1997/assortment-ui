/**
 * Size Performance (Overall) — dummy for now. Size isn't a dimension
 * of the sales aggregate.
 */

import { Ruler } from 'lucide-react';
import { SectionCard } from './SectionCard';
import { RecommendationChip } from './RecommendationChip';
import { DUMMY_SIZES } from '../utils/demoData';

export function SizePerformanceCard() {
  return (
    <SectionCard
      title="Size Performance (Overall)"
      icon={Ruler}
      right={<DemoBadge />}
    >
      <table className="w-full text-[11.5px]">
        <thead>
          <tr style={{ color: 'var(--color-text-tertiary)' }}>
            <Th align="left">Size</Th>
            <Th>Sales %</Th>
            <Th>Sell Through</Th>
            <Th>Returns %</Th>
            <Th align="left">AI Recommendation</Th>
          </tr>
        </thead>
        <tbody>
          {DUMMY_SIZES.map((s) => (
            <tr key={s.size} className="border-t"
              style={{ borderColor: 'var(--color-divider)' }}>
              <Td align="left">
                <span className="font-medium"
                  style={{ color: 'var(--color-text-primary)' }}>
                  {s.size}
                </span>
              </Td>
              <Td>{s.salesPct}%</Td>
              <Td>{s.strPct}%</Td>
              <Td>{s.returnsPct.toFixed(1)}%</Td>
              <Td align="left"><RecommendationChip label={s.recommendation} /></Td>
            </tr>
          ))}
        </tbody>
      </table>
    </SectionCard>
  );
}

function DemoBadge() {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-wider"
      style={{ background: 'rgba(148,163,184,0.20)', color: '#475569' }}
    >
      Demo
    </span>
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
