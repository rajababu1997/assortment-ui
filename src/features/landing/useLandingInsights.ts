/**
 * Pure derivation of landing-page insights from Redux + setup state.
 * Powers the hero headline/summary and the 4 floating KPI cards.
 */

import { useMemo } from 'react';
import { OTB_STATES } from '@/features/otb/constants';
import { daysBetween } from '@/features/otb/utils/periods';
import type { AnnualPlan, Period } from '@/features/otb/types';
import type { TimeConfig } from '@/features/setup/types';
import type { StatTone } from './components/StatStrip';

interface Input {
  todayMs: number;
  periods: Period[];
  annual: AnnualPlan | null;
  timeConfig: TimeConfig | null;
  allocated: number;
  overallBudget: number;
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
  dueThisWeek: number;
  briefRingPct: number;
  briefRingSubtitle: string;
  briefRows: BriefRow[];
  stats: Stat[];
}

export function useLandingInsights(input: Input): Output {
  const { todayMs, periods, annual, allocated, overallBudget } = input;

  return useMemo(() => {
    const allocatedPct = overallBudget > 0 ? Math.round((allocated / overallBudget) * 100) : 0;

    const dueThisWeek = periods.filter((p) => {
      const plan = annual?.periods[p.key];
      if (!plan) return false;
      if (plan.state === OTB_STATES.LOCKED || plan.state === OTB_STATES.SKIPPED) return false;
      const d = daysBetween(p.lock_deadline_iso, todayMs);
      return d >= 0 && d <= 7;
    }).length;

    const overdueCount = periods.filter((p) => {
      const plan = annual?.periods[p.key];
      if (!plan) return false;
      if (plan.state === OTB_STATES.LOCKED || plan.state === OTB_STATES.SKIPPED) return false;
      return daysBetween(p.lock_deadline_iso, todayMs) < 0;
    }).length;

    // TODO-DATA: sales-vs-plan MTD wired to a real selector once execution
    // metrics land. Stubbed for now.
    const salesMtdDelta = 4.2;
    // TODO-DATA: designer briefs once Range/Design module ships.
    const pendingBriefs = 12;

    const heroHeadline = buildHeroHeadline({ hasPlan: !!annual, dueThisWeek, overdueCount });
    const heroSummary = buildHeroSummary({ hasPlan: !!annual, allocatedPct, dueThisWeek, overdueCount });

    // Brief widget — uses real values when a plan exists, else demo fallbacks
    // so the hero looks alive in client demos before any plan has been created.
    const totalPeriods = periods.length || 12;
    const lockedCount = periods.filter((p) => {
      const plan = annual?.periods[p.key];
      return plan?.state === OTB_STATES.LOCKED || plan?.state === OTB_STATES.SKIPPED;
    }).length;
    const lockedPct = totalPeriods > 0 ? Math.round((lockedCount / totalPeriods) * 100) : 0;

    const briefRingPct = annual ? lockedPct : 42;
    const briefRingSubtitle = annual ? 'of periods locked' : 'of demo plan locked';

    const briefRows: BriefRow[] = annual
      ? [
          { label: 'Plan allocated',     value: `${allocatedPct}%`,                   tone: 'accent' },
          { label: 'Periods locked',     value: `${lockedCount} of ${totalPeriods}`,  tone: 'neutral' },
          { label: 'Releases this week', value: `${dueThisWeek}`,                     tone: dueThisWeek > 0 ? 'accent' : 'neutral' },
          { label: 'Overdue locks',      value: `${overdueCount}`,                    tone: overdueCount > 0 ? 'down' : 'up' },
        ]
      : [
          { label: 'Plan allocated',     value: '68%',         tone: 'accent' },
          { label: 'Periods locked',     value: '5 of 12',     tone: 'neutral' },
          { label: 'Releases this week', value: '3',           tone: 'accent' },
          { label: 'Overdue locks',      value: '0',           tone: 'up' },
        ];

    const stats: Stat[] = [
      {
        label: 'Plan allocated',
        value: allocatedPct,
        suffix: '%',
        formatter: 'percent',
        delta: annual ? `${formatShortMoney(allocated)} / ${formatShortMoney(overallBudget)}` : 'No plan yet',
        deltaTone: 'neutral',
        tone: 'primary',
      },
      {
        label: 'Releases this week',
        value: dueThisWeek,
        formatter: 'number',
        delta: overdueCount > 0 ? `${overdueCount} overdue` : 'On schedule',
        deltaTone: overdueCount > 0 ? 'down' : 'up',
        tone: overdueCount > 0 ? 'warning' : 'success',
      },
      {
        label: 'Sales vs plan (MTD)',
        value: salesMtdDelta,
        suffix: '%',
        formatter: 'percent',
        delta: 'vs plan',
        deltaTone: 'up',
        tone: 'success',
      },
      {
        label: 'Designer briefs pending',
        value: pendingBriefs,
        formatter: 'number',
        delta: 'awaiting design',
        deltaTone: 'neutral',
        tone: 'info',
      },
    ];

    return { heroHeadline, heroSummary, dueThisWeek, briefRingPct, briefRingSubtitle, briefRows, stats };
  }, [todayMs, periods, annual, allocated, overallBudget]);
}

function buildHeroHeadline(args: {
  hasPlan: boolean;
  dueThisWeek: number;
  overdueCount: number;
}): string {
  if (!args.hasPlan) return 'Shape the season — start with a plan.';
  if (args.overdueCount > 0) return `Decisions are waiting — ${args.overdueCount} overdue.`;
  if (args.dueThisWeek > 0) return `This week's locks — ${args.dueThisWeek} on the table.`;
  return 'You shape the season — the plan keeps the team aligned.';
}

function buildHeroSummary(args: {
  hasPlan: boolean;
  allocatedPct: number;
  dueThisWeek: number;
  overdueCount: number;
}): string {
  if (!args.hasPlan) {
    return 'No annual plan yet. Set the budget envelope and we will cascade it across periods, brands, and categories.';
  }
  const parts: string[] = [];
  if (args.dueThisWeek > 0) parts.push(`${args.dueThisWeek} period${args.dueThisWeek === 1 ? '' : 's'} to lock this week`);
  if (args.overdueCount > 0) parts.push(`${args.overdueCount} overdue`);
  parts.push(`plan is ${args.allocatedPct}% allocated`);
  return parts.join(' · ') + '.';
}

function formatShortMoney(n: number): string {
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(1)}Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(1)}L`;
  if (n >= 1e3) return `₹${(n / 1e3).toFixed(0)}K`;
  return `₹${n}`;
}
