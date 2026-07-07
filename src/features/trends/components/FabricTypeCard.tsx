/**
 * Fabric Type Performance — donut on the left, table on the right.
 * Uses the same SVG donut style as BandMixSection.
 */

import { Palette } from 'lucide-react';
import { SectionCard } from './SectionCard';
import { RecommendationChip } from './RecommendationChip';
import { classifyAttribute } from '../utils/aiInsights';
import type { AttributePerf } from '../useTrendData';

const PALETTE = ['#f97316', '#2563eb', '#22c55e', '#a855f7', '#eab308', '#0ea5e9', '#ef4444'];

interface Props {
  rows: AttributePerf[];
  isLoading: boolean;
}

export function FabricTypeCard({ rows, isLoading }: Props) {
  const top = rows.slice(0, 6);
  return (
    <SectionCard title="Fabric Type Performance" icon={Palette}>
      {isLoading ? (
        <SkeletonRow />
      ) : top.length === 0 ? (
        <Empty label="No fabric-level attribute data" />
      ) : (
        <div className="grid grid-cols-1 items-center gap-4 md:grid-cols-[160px_1fr]">
          <Donut rows={top} />
          <Table rows={top} />
        </div>
      )}
    </SectionCard>
  );
}

function Donut({ rows }: { rows: AttributePerf[] }) {
  const size = 160;
  const cx = size / 2;
  const cy = size / 2;
  const r = 64;
  const rInner = 40;
  let cum = 0;
  const total = rows.reduce((s, r0) => s + r0.salesPct, 0) || 1;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
      {rows.map((r0, i) => {
        const start = cum;
        cum += (r0.salesPct / total) * 100;
        return (
          <path
            key={r0.key}
            d={annularSlice(cx, cy, r, rInner, start, cum)}
            fill={PALETTE[i % PALETTE.length]}
            stroke="#fff"
            strokeWidth={1.5}
          >
            <title>{r0.label}: {r0.salesPct.toFixed(1)}%</title>
          </path>
        );
      })}
    </svg>
  );
}

function Table({ rows }: { rows: AttributePerf[] }) {
  return (
    <table className="w-full text-[11.5px]">
      <thead>
        <tr style={{ color: 'var(--color-text-tertiary)' }}>
          <Th align="left">Fabric Type</Th>
          <Th>Sales %</Th>
          <Th>GP%</Th>
          <Th>AI Recommendation</Th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.key} className="border-t"
            style={{ borderColor: 'var(--color-divider)' }}>
            <Td align="left">
              <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                {r.label}
              </span>
            </Td>
            <Td>{r.salesPct.toFixed(0)}%</Td>
            <Td>{r.gpPct.toFixed(0)}%</Td>
            <Td ><RecommendationChip label={classifyAttribute(r)} /></Td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Th({ children, align = 'right' }: { children: React.ReactNode; align?: 'left' | 'right' }) {
  return (
    <th
      className="pb-1.5 text-[10px] font-semibold uppercase tracking-[0.10em]"
      style={{ textAlign: align }}
    >
      {children}
    </th>
  );
}
function Td({ children, align = 'right' }: { children: React.ReactNode; align?: 'left' | 'right' }) {
  return (
    <td className="py-1 tabular-nums" style={{ textAlign: align, color: 'var(--color-text-secondary)' }}>
      {children}
    </td>
  );
}

function SkeletonRow() {
  return (
    <div
      className="h-[220px] animate-pulse rounded-md"
      style={{ background: 'var(--color-surface-alt, #f1f5f9)' }}
    />
  );
}

function Empty({ label }: { label: string }) {
  return (
    <div className="flex h-[180px] items-center justify-center text-[12px]"
      style={{ color: 'var(--color-text-tertiary)' }}>
      {label}
    </div>
  );
}

function annularSlice(
  cx: number, cy: number, rO: number, rI: number,
  pctStart: number, pctEnd: number,
): string {
  const a0 = (pctStart / 100) * Math.PI * 2 - Math.PI / 2;
  const a1 = (pctEnd / 100) * Math.PI * 2 - Math.PI / 2;
  const large = pctEnd - pctStart > 50 ? 1 : 0;
  const x0o = cx + rO * Math.cos(a0), y0o = cy + rO * Math.sin(a0);
  const x1o = cx + rO * Math.cos(a1), y1o = cy + rO * Math.sin(a1);
  const x0i = cx + rI * Math.cos(a1), y0i = cy + rI * Math.sin(a1);
  const x1i = cx + rI * Math.cos(a0), y1i = cy + rI * Math.sin(a0);
  return `M ${x0o} ${y0o} A ${rO} ${rO} 0 ${large} 1 ${x1o} ${y1o} L ${x0i} ${y0i} A ${rI} ${rI} 0 ${large} 0 ${x1i} ${y1i} Z`;
}
