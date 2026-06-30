/**
 * Pure derivation of landing-page insights from the all-OTBs lifecycle feed.
 * Powers the hero headline/summary, the brief widget rows, and the 4 KPI
 * cards in the StatStrip.
 *
 * The home page now reflects the *whole* pipeline — every OTB across every
 * annual plan — instead of the single-plan release view it used pre-refactor.
 */

import { useMemo } from 'react';
import type { OtbRowView, LifecycleState } from '@/features/otb/lifecycle/types';
import type { StatTone } from './components/StatStrip';

interface Input {
  rows: OtbRowView[];
  isLoading: boolean;
}

interface Stat {
  label: string;
  value: number;
  suffix?: string;
  prefix?: string;
  formatter?: 'number' | 'percent' | 'money';
  delta?: string;
  deltaTone?: 'up' | 'down' | 'neutral';
  tone: StatTone;
}

export interface BriefRow {
  label: string;
  value: string;
  tone?: 'up' | 'down' | 'accent' | 'neutral';
}

interface Output {
  heroHeadline: string;
  heroSummary: string;
  briefRingPct: number;
  briefRingSubtitle: string;
  briefRows: BriefRow[];
  stats: Stat[];
  totalOtbs: number;
  hasData: boolean;
}

export function useLandingInsights({ rows, isLoading }: Input): Output {
  return useMemo(() => {
    const counts = countByStage(rows);
    const totalOtbs = rows.length;
    const finalisedPct = totalOtbs > 0 ? Math.round((counts.final_approved / totalOtbs) * 100) : 0;

    // Action-oriented counts — each one is "the next thing someone needs to do"
    // at that stage. The home page makes those visible at a glance.
    const pendingVp = counts.released;                  // released but no VP yet
    const pendingOp = counts.value_planned;             // VP done, no OP yet
    const pendingFinal = counts.option_planned;         // OP done, awaiting Admin

    const hasData = totalOtbs > 0;
    const heroHeadline = buildHeroHeadline({ hasData, isLoading, pendingFinal, pendingVp });
    const heroSummary = buildHeroSummary({ hasData, totalOtbs, pendingVp, pendingOp, pendingFinal, finalised: counts.final_approved });

    const briefRingSubtitle = hasData
      ? `${counts.final_approved} of ${totalOtbs} OTBs finalised`
      : 'No OTBs in the pipeline yet';

    const briefRows: BriefRow[] = hasData
      ? [
          { label: 'Total OTBs',     value: `${totalOtbs}`,    tone: 'neutral' },
          { label: 'Released',       value: `${counts.released + counts.value_planned + counts.option_planned + counts.final_approved}`, tone: 'accent' },
          { label: 'Value-planned',  value: `${counts.value_planned + counts.option_planned + counts.final_approved}`, tone: 'accent' },
          { label: 'Awaiting Admin', value: `${pendingFinal}`, tone: pendingFinal > 0 ? 'down' : 'up' },
        ]
      : [
          { label: 'Total OTBs',     value: '0',   tone: 'neutral' },
          { label: 'Released',       value: '0',   tone: 'neutral' },
          { label: 'Value-planned',  value: '0',   tone: 'neutral' },
          { label: 'Awaiting Admin', value: '0',   tone: 'neutral' },
        ];

    const stats: Stat[] = [
      {
        label: 'Total OTBs',
        value: totalOtbs,
        formatter: 'number',
        delta: hasData ? `${counts.final_approved} finalised` : 'No OTBs yet',
        deltaTone: 'neutral',
        tone: 'primary',
      },
      {
        label: 'Pending Value Plan',
        value: pendingVp,
        formatter: 'number',
        delta: pendingVp > 0 ? 'buyers to act' : 'all caught up',
        deltaTone: pendingVp > 0 ? 'down' : 'up',
        tone: pendingVp > 0 ? 'warning' : 'success',
      },
      {
        label: 'Pending Option Plan',
        value: pendingOp,
        formatter: 'number',
        delta: pendingOp > 0 ? 'buyers + designer' : 'all caught up',
        deltaTone: pendingOp > 0 ? 'down' : 'up',
        tone: pendingOp > 0 ? 'warning' : 'success',
      },
      {
        label: 'Awaiting Admin',
        value: pendingFinal,
        formatter: 'number',
        delta: pendingFinal > 0 ? 'final approval' : 'no backlog',
        deltaTone: pendingFinal > 0 ? 'down' : 'up',
        tone: pendingFinal > 0 ? 'info' : 'success',
      },
    ];

    return {
      heroHeadline,
      heroSummary,
      briefRingPct: finalisedPct,
      briefRingSubtitle,
      briefRows,
      stats,
      totalOtbs,
      hasData,
    };
  }, [rows, isLoading]);
}

type StageCounts = Record<LifecycleState, number>;

function countByStage(rows: OtbRowView[]): StageCounts {
  const out: StageCounts = {
    planned: 0,
    released: 0,
    value_planned: 0,
    option_planned: 0,
    final_approved: 0,
  };
  for (const r of rows) {
    out[r.lifecycle_state] = (out[r.lifecycle_state] ?? 0) + 1;
  }
  return out;
}

function buildHeroHeadline(args: {
  hasData: boolean;
  isLoading: boolean;
  pendingFinal: number;
  pendingVp: number;
}): string {
  if (args.isLoading) return 'Loading your pipeline…';
  if (!args.hasData) return 'Shape the season — start with an annual plan.';
  if (args.pendingFinal > 0)
    return `Admin queue — ${args.pendingFinal} OTB${args.pendingFinal === 1 ? '' : 's'} awaiting final approval.`;
  if (args.pendingVp > 0)
    return `Released — ${args.pendingVp} OTB${args.pendingVp === 1 ? '' : 's'} ready for value planning.`;
  return 'Pipeline is moving — every released OTB is being planned.';
}

function buildHeroSummary(args: {
  hasData: boolean;
  totalOtbs: number;
  pendingVp: number;
  pendingOp: number;
  pendingFinal: number;
  finalised: number;
}): string {
  if (!args.hasData) {
    return 'No annual plan yet. Create one in OTB Planning and we will cascade through release, value, option, and final approval.';
  }
  const parts: string[] = [`${args.totalOtbs} OTB${args.totalOtbs === 1 ? '' : 's'} in pipeline`];
  if (args.pendingVp > 0) parts.push(`${args.pendingVp} pending VP`);
  if (args.pendingOp > 0) parts.push(`${args.pendingOp} pending OP`);
  if (args.pendingFinal > 0) parts.push(`${args.pendingFinal} awaiting Admin`);
  parts.push(`${args.finalised} finalised`);
  return parts.join(' · ') + '.';
}
