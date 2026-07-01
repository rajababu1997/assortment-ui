/**
 * Top-of-page KPI tiles — 4 headline metrics rendered as small
 * value-plus-meaning cards. Designed to read in ~2 seconds.
 */

import {
  AlertTriangle,
  ListChecks,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import type { KpiSnapshot } from '../useDashboardKpis';

interface Props {
  snapshot: KpiSnapshot;
  isLoading: boolean;
}

const fmtCr = (v: number) => `₹${(v / 1e7).toFixed(1)} Cr`;
const fmtPct = (v: number) => `${Math.round(v * 100)}%`;

export function KpiStrip({ snapshot, isLoading }: Props) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <Tile
        icon={ListChecks}
        tone="info"
        label="Items needing action"
        value={isLoading ? '—' : String(snapshot.totalWip)}
        sub="Across draft, review, revisions"
      />
      <Tile
        icon={AlertTriangle}
        tone={snapshot.stuck > 0 ? 'warning' : 'neutral'}
        label="Stuck > 3 days"
        value={isLoading ? '—' : String(snapshot.stuck)}
        sub={snapshot.stuck > 0 ? 'Could be blocked' : 'Nothing overdue'}
      />
      <Tile
        icon={Wallet}
        tone="success"
        label="Budget committed"
        value={isLoading ? '—' : fmtCr(snapshot.committed)}
        sub={`of ${fmtCr(snapshot.totalBudget)} planned`}
      />
      <Tile
        icon={TrendingUp}
        tone="accent"
        label="Plan utilization"
        value={isLoading ? '—' : fmtPct(snapshot.utilization)}
        sub="Released ÷ planned"
        progress={snapshot.utilization}
      />
    </div>
  );
}

interface TileProps {
  icon: LucideIcon;
  label: string;
  value: string;
  sub?: string;
  tone: 'info' | 'success' | 'warning' | 'accent' | 'neutral';
  progress?: number;
}

const TONE_BG: Record<TileProps['tone'], string> = {
  info: 'rgba(96,165,250,0.10)',
  success: 'rgba(16,185,129,0.10)',
  warning: 'rgba(245,158,11,0.12)',
  accent: 'color-mix(in srgb, var(--color-primary) 10%, transparent)',
  neutral: 'var(--color-surface-alt, #f1f5f9)',
};

const TONE_FG: Record<TileProps['tone'], string> = {
  info: '#1d4ed8',
  success: '#047857',
  warning: '#b45309',
  accent: 'var(--color-primary)',
  neutral: 'var(--color-text-secondary)',
};

function Tile({ icon: Icon, label, value, sub, tone, progress }: TileProps) {
  return (
    <div
      className="rounded-xl border px-3 py-2.5"
      style={{
        background: 'var(--color-surface)',
        borderColor: 'var(--color-divider)',
      }}
    >
      <div className="flex items-center gap-2">
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
          style={{ background: TONE_BG[tone], color: TONE_FG[tone] }}
        >
          <Icon size={13} />
        </span>
        <span
          className="text-[9.5px] font-bold uppercase tracking-[0.10em]"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          {label}
        </span>
      </div>
      <div
        className="mt-1.5 text-lg font-bold tabular-nums leading-tight"
        style={{ color: 'var(--color-text-primary)' }}
      >
        {value}
      </div>
      {sub && (
        <div
          className="mt-0.5 truncate text-[10.5px]"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          {sub}
        </div>
      )}
      {progress !== undefined && (
        <div
          className="mt-1.5 h-1 overflow-hidden rounded-full"
          style={{ background: 'var(--color-surface-alt, #f1f5f9)' }}
        >
          <div
            className="h-full rounded-full"
            style={{
              width: `${Math.min(100, Math.max(0, progress * 100))}%`,
              background: TONE_FG[tone],
            }}
          />
        </div>
      )}
    </div>
  );
}
