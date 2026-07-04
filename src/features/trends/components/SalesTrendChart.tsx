/**
 * Sales Trend Over Time — LY line, TY line + bars, and a mock forecast
 * continuation drawn as a dashed line. Pure SVG so we don't need to
 * pull in a charting dep.
 */

import { TrendingUp } from 'lucide-react';
import type { MonthlyTrendPoint } from '@/features/sales/types';
import { SectionCard } from './SectionCard';
import { monthLabel } from '../utils/format';
import { forecastNextMonths } from '../utils/demoData';

interface Props {
  ty: MonthlyTrendPoint[];
  ly: MonthlyTrendPoint[];
  isLoading: boolean;
}

const H = 240;
const PAD_L = 44;
const PAD_R = 12;
const PAD_T = 12;
const PAD_B = 28;

export function SalesTrendChart({ ty, ly, isLoading }: Props) {
  const tyValues = ty.map((p) => p.netSalesValue);
  const lyValues = ly.map((p) => p.netSalesValue);
  const lastTy = tyValues.at(-1) ?? 0;
  const forecast = lastTy > 0 ? forecastNextMonths(lastTy, 3, 0.03) : [];
  const labels = [
    ...ty.map((p) => monthLabel(p.periodKey)),
    ...forecast.map((_, i) => `F${i + 1}`),
  ];

  const maxVal = Math.max(1, ...tyValues, ...lyValues, ...forecast);
  const w = 720; // logical width — scales via viewBox
  const columns = Math.max(labels.length, 1);
  const colWidth = (w - PAD_L - PAD_R) / columns;

  const x = (i: number) => PAD_L + colWidth * (i + 0.5);
  const y = (v: number) => PAD_T + (H - PAD_T - PAD_B) * (1 - v / maxVal);

  const buildLine = (values: number[]): string =>
    values.length
      ? values
          .map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(v)}`)
          .join(' ')
      : '';

  const tyLine = buildLine(tyValues);
  const lyLine = buildLine(lyValues);
  const forecastLine = forecast.length
    ? [lastTy, ...forecast]
        .map((v, i) => {
          const xi = x(tyValues.length - 1 + i);
          return `${i === 0 ? 'M' : 'L'} ${xi} ${y(v)}`;
        })
        .join(' ')
    : '';

  return (
    <SectionCard title="Sales Trend Over Time" icon={TrendingUp}>
      {isLoading ? (
        <div
          className="h-[240px] animate-pulse rounded-md"
          style={{ background: 'var(--color-surface-alt, #f1f5f9)' }}
        />
      ) : (
        <>
          <div className="mb-2 flex items-center gap-4 text-[11px]"
            style={{ color: 'var(--color-text-tertiary)' }}>
            <LegendDot color="#2563eb" label="This Year" />
            <LegendDot color="#94a3b8" label="Last Year" />
            <LegendDot color="#a78bfa" dashed label="Forecast" />
          </div>

          <svg viewBox={`0 0 ${w} ${H}`} className="w-full h-[240px]">
            {/* Y-axis grid */}
            {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
              const yl = PAD_T + (H - PAD_T - PAD_B) * (1 - frac);
              return (
                <g key={frac}>
                  <line
                    x1={PAD_L} x2={w - PAD_R} y1={yl} y2={yl}
                    stroke="var(--color-divider)" strokeDasharray="2 4"
                  />
                  <text
                    x={PAD_L - 6} y={yl + 3}
                    textAnchor="end" fontSize={9}
                    fill="var(--color-text-tertiary)"
                  >
                    ₹{compact(maxVal * frac)}
                  </text>
                </g>
              );
            })}

            {/* TY bars */}
            {tyValues.map((v, i) => {
              const barW = Math.max(2, colWidth * 0.35);
              const yv = y(v);
              return (
                <rect
                  key={i}
                  x={x(i) - barW / 2}
                  y={yv}
                  width={barW}
                  height={Math.max(0, H - PAD_B - yv)}
                  fill="#2563eb"
                  opacity={0.18}
                  rx={2}
                />
              );
            })}

            {/* LY line */}
            {lyLine && (
              <path
                d={lyLine}
                fill="none"
                stroke="#94a3b8"
                strokeWidth={1.5}
                strokeDasharray="3 3"
              />
            )}

            {/* TY line */}
            {tyLine && (
              <path
                d={tyLine}
                fill="none"
                stroke="#2563eb"
                strokeWidth={2}
              />
            )}

            {/* Forecast dashed */}
            {forecastLine && (
              <path
                d={forecastLine}
                fill="none"
                stroke="#a78bfa"
                strokeWidth={2}
                strokeDasharray="4 4"
              />
            )}

            {/* Data points */}
            {tyValues.map((v, i) => (
              <circle key={`p-${i}`} cx={x(i)} cy={y(v)} r={2.5} fill="#2563eb" />
            ))}

            {/* X-axis labels */}
            {labels.map((lbl, i) => (
              <text
                key={i}
                x={x(i)}
                y={H - PAD_B + 14}
                textAnchor="middle"
                fontSize={10}
                fill="var(--color-text-tertiary)"
              >
                {lbl}
              </text>
            ))}
          </svg>
        </>
      )}
    </SectionCard>
  );
}

function LegendDot({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="inline-block h-[6px] w-4 rounded-full"
        style={{
          background: dashed
            ? `repeating-linear-gradient(90deg, ${color} 0 4px, transparent 4px 8px)`
            : color,
        }}
      />
      {label}
    </span>
  );
}

/** Compact ₹ for chart ticks — max width axis is fixed, so keep it short. */
function compact(v: number): string {
  const abs = Math.abs(v);
  if (abs >= 1_00_00_000) return `${(v / 1_00_00_000).toFixed(1)}Cr`;
  if (abs >= 1_00_000)    return `${(v / 1_00_000).toFixed(1)}L`;
  if (abs >= 1_000)       return `${(v / 1_000).toFixed(0)}K`;
  return `${Math.round(v)}`;
}
