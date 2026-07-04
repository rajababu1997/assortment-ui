/**
 * Top-of-page KPI strip — 8 tiles matching the reference layout. Each
 * shows the current-year value + a signed delta vs LY. Direction of
 * "good" is different per metric (markdown down = good, inventory down
 * = good, others up = good).
 */

import {
  Activity,
  Boxes,
  CircleDollarSign,
  Layers,
  LineChart,
  Package,
  Percent,
  ShoppingBag,
  type LucideIcon,
} from 'lucide-react';
import type { KpiSet } from '../useTrendData';
import { DeltaBadge } from './DeltaBadge';
import { fmtMoney, fmtUnits, growthPct } from '../utils/format';

interface Props {
  ty: KpiSet;
  ly: KpiSet;
  isLoading: boolean;
}

type Tone = 'blue' | 'green' | 'emerald' | 'amber' | 'red' | 'purple' | 'indigo' | 'teal';

interface TileDef {
  key: string;
  label: string;
  icon: LucideIcon;
  tone: Tone;
  value: string;
  delta: number;
  higherBetter: boolean;
  deltaSuffix?: string;
  demoOnly?: boolean;
}

const TONE_BG: Record<Tone, string> = {
  blue:    'rgba(96,165,250,0.18)',
  green:   'rgba(16,185,129,0.16)',
  emerald: 'rgba(5,150,105,0.18)',
  amber:   'rgba(245,158,11,0.18)',
  red:     'rgba(239,68,68,0.16)',
  purple:  'rgba(167,139,250,0.18)',
  indigo:  'rgba(99,102,241,0.18)',
  teal:    'rgba(20,184,166,0.18)',
};
const TONE_BORDER: Record<Tone, string> = {
  blue:    'rgba(96,165,250,0.32)',
  green:   'rgba(16,185,129,0.30)',
  emerald: 'rgba(5,150,105,0.32)',
  amber:   'rgba(245,158,11,0.32)',
  red:     'rgba(239,68,68,0.30)',
  purple:  'rgba(167,139,250,0.32)',
  indigo:  'rgba(99,102,241,0.32)',
  teal:    'rgba(20,184,166,0.32)',
};
const TONE_FG: Record<Tone, string> = {
  blue:    '#1d4ed8',
  green:   '#047857',
  emerald: '#059669',
  amber:   '#b45309',
  red:     '#b91c1c',
  purple:  '#6d28d9',
  indigo:  '#4338ca',
  teal:    '#0f766e',
};

export function KpiStrip({ ty, ly, isLoading }: Props) {
  const tiles: TileDef[] = [
    {
      key: 'net-sales',
      label: 'Net Sales (₹)',
      icon: CircleDollarSign,
      tone: 'blue',
      value: fmtMoney(ty.netSales),
      delta: growthPct(ty.netSales, ly.netSales),
      higherBetter: true,
    },
    {
      key: 'units',
      label: 'Units Sold',
      icon: ShoppingBag,
      tone: 'indigo',
      value: fmtUnits(ty.netSalesUnits),
      delta: growthPct(ty.netSalesUnits, ly.netSalesUnits),
      higherBetter: true,
    },
    {
      key: 'gp',
      label: 'GP%',
      icon: Percent,
      tone: 'green',
      value: `${ty.gpPct.toFixed(1)}%`,
      delta: ty.gpPct - ly.gpPct,
      higherBetter: true,
      deltaSuffix: 'pp',
    },
    {
      key: 'str',
      label: 'Sell Through',
      icon: LineChart,
      tone: 'emerald',
      value: `${ty.strPct.toFixed(1)}%`,
      delta: ty.strPct - ly.strPct,
      higherBetter: true,
      deltaSuffix: 'pp',
    },
    {
      key: 'md',
      label: 'Markdown %',
      icon: Activity,
      tone: 'amber',
      value: `${ty.markdownPct.toFixed(1)}%`,
      delta: ty.markdownPct - ly.markdownPct,
      higherBetter: false,
      deltaSuffix: 'pp',
    },
    {
      key: 'inventory',
      label: 'Inventory (₹)',
      icon: Package,
      tone: 'purple',
      value: fmtMoney(ty.inventoryValue),
      delta: growthPct(ty.inventoryValue, ly.inventoryValue),
      higherBetter: false,
    },
    {
      key: 'weeks-cover',
      label: 'Weeks Cover',
      icon: Boxes,
      tone: 'red',
      value: ty.weeksCover.toFixed(1),
      delta: ty.weeksCover - ly.weeksCover,
      higherBetter: false,
      deltaSuffix: '',
      demoOnly: false,
    },
    {
      key: 'turn',
      label: 'Inventory Turn',
      icon: Layers,
      tone: 'teal',
      value: ty.inventoryTurn.toFixed(1),
      delta: ty.inventoryTurn - ly.inventoryTurn,
      higherBetter: true,
      deltaSuffix: '',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-8">
      {tiles.map((t) => (
        <Tile key={t.key} def={t} isLoading={isLoading} />
      ))}
    </div>
  );
}

function Tile({ def, isLoading }: { def: TileDef; isLoading: boolean }) {
  const Icon = def.icon;
  return (
    <div
      className="rounded-xl border px-3 py-2.5"
      style={{
        background: `linear-gradient(180deg, ${TONE_BG[def.tone]} 0%, var(--color-surface) 70%)`,
        borderColor: TONE_BORDER[def.tone],
      }}
    >
      <div className="flex items-center gap-2">
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
          style={{ background: TONE_BG[def.tone], color: TONE_FG[def.tone] }}
        >
          <Icon size={13} />
        </span>
        <span
          className="text-[10px] font-bold uppercase tracking-[0.08em] truncate"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          {def.label}
        </span>
      </div>
      <div
        className="mt-1.5 truncate text-lg font-bold tabular-nums leading-tight"
        style={{ color: 'var(--color-text-primary)' }}
        title={def.value}
      >
        {isLoading ? '—' : def.value}
      </div>
      <div className="mt-0.5">
        {!isLoading && (
          <DeltaBadge
            value={def.delta}
            higherBetter={def.higherBetter}
            suffix={def.deltaSuffix ?? '%'}
            tail="vs LY"
          />
        )}
      </div>
    </div>
  );
}
