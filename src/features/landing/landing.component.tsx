/**
 * Assortment Planning — post-login landing page.
 *
 *   ┌──── Immersive HERO (dark gradient + drape + glass brief widget) ─────┐
 *   │  + floating STAT STRIP overlapping hero bottom                       │
 *   ├──────────────────────────────────────────────────────────────────────┤
 *   │  LIFECYCLE — horizontal connected phase strip (Plan → Sense)         │
 *   └──────────────────────────────────────────────────────────────────────┘
 *
 * Data: `useApiAllOtbRows()` — the same lifecycle feed that drives `/otb/all`.
 * One round-trip gives every OTB across every annual plan, joined with its
 * VP/OP states. All KPIs and the hero summary are derived from that.
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAppSelector } from '@/hooks/useAppSelector';
import { useDemoToday } from '@/hooks/useDemoClock';
import { useSetupConfig, useAllPlans } from '@/features/otb/useOtb';
import { useApiAnnualPlans } from '@/features/otb/useApiAnnualPlans';
import { useApiAllOtbRows } from '@/features/otb/lifecycle/useApiOtbLifecycle';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { hydrateAnnualPlans } from '@/store/slices/otbSlice';
import { useEffect } from 'react';
import { HeroBanner } from './components/HeroBanner';
import { StatStrip } from './components/StatStrip';
import { LifecycleNavigator } from './components/LifecycleNavigator';
import { useLandingInsights } from './useLandingInsights';

const CONTAINER = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};

export default function LandingPage() {
  const user = useAppSelector((s) => s.auth.user);
  const todayMs = useDemoToday();
  const { company, timeConfig, releaseConfig } = useSetupConfig();
  const setupComplete = !!company && !!timeConfig && !!releaseConfig;

  // Hydrate Redux from server so `useAllPlans()` has the windows we need to
  // bound the lifecycle query (unbounded `/otb/lifecycle/rows/all` 500s on
  // the backend — we always pass a date range derived from the union of
  // every annual plan's window).
  const dispatch = useAppDispatch();
  const apiAnnual = useApiAnnualPlans();
  useEffect(() => {
    if (apiAnnual.data && apiAnnual.data.length > 0) {
      dispatch(hydrateAnnualPlans(apiAnnual.data));
    }
  }, [apiAnnual.data, dispatch]);
  const plans = useAllPlans();

  const dateRange = useMemo(() => {
    if (plans.length === 0) return null;
    let from = plans[0].plan_start_iso;
    let to = plans[0].plan_end_iso;
    for (const p of plans) {
      if (p.plan_start_iso < from) from = p.plan_start_iso;
      if (p.plan_end_iso > to) to = p.plan_end_iso;
    }
    return { from, to };
  }, [plans]);

  const { data: rows, isLoading } = useApiAllOtbRows(
    dateRange?.from,
    dateRange?.to,
    { enabled: !!dateRange },
  );

  const firstName = user?.firstName || user?.userName || 'there';

  const insights = useLandingInsights({
    rows: rows ?? [],
    isLoading: apiAnnual.isLoading || isLoading,
  });

  return (
    <div
      className="relative min-h-full"
      style={{
        background:
          'radial-gradient(1200px 600px at 10% -10%, color-mix(in srgb, var(--color-primary) 6%, transparent) 0%, transparent 60%), ' +
          'radial-gradient(900px 500px at 110% 10%, rgba(167,139,250,0.10) 0%, transparent 60%), ' +
          'var(--color-surface-alt, #f8fafc)',
      }}
    >
      <motion.div
        variants={CONTAINER}
        initial="hidden"
        animate="visible"
        className="relative flex w-full flex-col gap-6 px-6 py-6 pb-12 xl:px-10"
      >
        <HeroBanner
          firstName={firstName}
          todayMs={todayMs}
          headline={insights.heroHeadline}
          summary={insights.heroSummary}
          ringPct={insights.briefRingPct}
          ringSubtitle={insights.briefRingSubtitle}
          briefRows={insights.briefRows}
          hasPlan={insights.hasData}
        />

        <StatStrip stats={insights.stats} />

        <LifecycleNavigator setupComplete={setupComplete} />
      </motion.div>
    </div>
  );
}
