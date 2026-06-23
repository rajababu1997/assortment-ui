/**
 * Assortment Planning — post-login landing page.
 *
 *   ┌──── Immersive HERO (dark gradient + drape + glass brief widget) ─────┐
 *   │  + floating STAT STRIP overlapping hero bottom                       │
 *   ├──────────────────────────────────────────────────────────────────────┤
 *   │  LIFECYCLE — horizontal connected phase strip (Plan → Sense)         │
 *   └──────────────────────────────────────────────────────────────────────┘
 *
 * Designed to look like a product, not a CRM dashboard. Page fluid up to
 * the viewport (no fixed max-width) so it doesn't gutter at lower zoom.
 */

import { motion } from 'framer-motion';
import { useAppSelector } from '@/hooks/useAppSelector';
import { useDemoToday } from '@/hooks/useDemoClock';
import { useSetupConfig, useAnnualPlan, usePeriods, annualTotal } from '@/features/otb/useOtb';
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
  const annual = useAnnualPlan();
  const periods = usePeriods();

  const firstName = user?.firstName || user?.userName || 'there';
  const allocated = annualTotal(annual?.periods);
  const overallBudget = annual?.overall_budget ?? 0;

  const insights = useLandingInsights({
    todayMs,
    periods,
    annual,
    timeConfig,
    allocated,
    overallBudget,
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
          hasPlan={!!annual}
        />

        <StatStrip stats={insights.stats} />

        <LifecycleNavigator setupComplete={setupComplete} />
      </motion.div>
    </div>
  );
}
