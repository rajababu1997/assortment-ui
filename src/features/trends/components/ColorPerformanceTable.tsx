/**
 * Top Colors by Sales % — dummy for now. Colour isn't a dimension of the
 * sales aggregate yet. Table is wired to `DUMMY_COLORS` and clearly
 * labelled as demo data at the bottom.
 */

import { Palette } from 'lucide-react';
import { SectionCard } from './SectionCard';
import { RecommendationChip } from './RecommendationChip';
import { DeltaBadge } from './DeltaBadge';
import { DUMMY_COLORS } from '../utils/demoData';

export function ColorPerformanceTable() {
  return (
    <SectionCard
      title="Top Colors by Sales %"
      icon={Palette}
      right={<DemoBadge />}
    >
      <table className="w-full text-[11.5px]">
        <thead>
          <tr style={{ color: 'var(--color-text-tertiary)' }}>
            <Th align="left">Color</Th>
            <Th>Sales %</Th>
            <Th>Growth vs LY</Th>
            <Th align="left">AI Recommendation</Th>
          </tr>
        </thead>
        <tbody>
          {DUMMY_COLORS.map((c) => (
            <tr key={c.color} className="border-t"
              style={{ borderColor: 'var(--color-divider)' }}>
              <Td align="left">
                <span className="inline-flex items-center gap-1.5">
                  <span
                    className="h-2.5 w-2.5 rounded-full border"
                    style={{ background: c.swatch, borderColor: 'var(--color-divider)' }}
                  />
                  <span className="font-medium"
                    style={{ color: 'var(--color-text-primary)' }}>
                    {c.color}
                  </span>
                </span>
              </Td>
              <Td>{c.salesPct}%</Td>
              <Td>
                {c.growthVsLy === 0
                  ? <span style={{ color: 'var(--color-text-tertiary)' }}>—</span>
                  : <DeltaBadge value={c.growthVsLy} />}
              </Td>
              <Td align="left"><RecommendationChip label={c.recommendation} /></Td>
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
      style={{
        background: 'rgba(148,163,184,0.20)',
        color: '#475569',
      }}
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
