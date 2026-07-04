/**
 * "TOP AI INSIGHTS" strip — 8 headline cards. Content is computed by
 * aiInsights.buildInsights() from the real aggregate data.
 */

import { Sparkles, TrendingUp, TrendingDown, Award, Layers, Palette, Ruler, Info } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Insight, InsightTone } from '../utils/aiInsights';

const TONE_META: Record<InsightTone, { bg: string; fg: string; border: string; icon: LucideIcon }> = {
  positive: { bg: 'rgba(16,185,129,0.10)',  fg: '#047857', border: 'rgba(16,185,129,0.25)',  icon: TrendingUp },
  warning:  { bg: 'rgba(239,68,68,0.10)',   fg: '#b91c1c', border: 'rgba(239,68,68,0.25)',   icon: TrendingDown },
  info:     { bg: 'rgba(96,165,250,0.10)',  fg: '#1d4ed8', border: 'rgba(96,165,250,0.25)',  icon: Info },
  neutral:  { bg: 'rgba(148,163,184,0.14)', fg: '#475569', border: 'var(--color-divider)',   icon: Award },
};

const METRIC_ICON: Record<string, LucideIcon> = {
  Fit: Layers,
  Fabric: Palette,
  Composition: Ruler,
  Category: Award,
  Overall: TrendingUp,
  Recommend: Sparkles,
};

interface Props {
  insights: Insight[];
  isLoading: boolean;
}

export function AiInsightsStrip({ insights, isLoading }: Props) {
  return (
    <section
      className="rounded-xl border bg-white p-3"
      style={{ borderColor: 'var(--color-divider)' }}
    >
      <header className="mb-2 flex items-center gap-2 px-1">
        <span
          className="flex h-6 w-6 items-center justify-center rounded-md"
          style={{
            background: 'color-mix(in srgb, var(--color-primary) 12%, transparent)',
            color: 'var(--color-primary)',
          }}
        >
          <Sparkles size={13} />
        </span>
        <h2
          className="text-[11px] font-semibold uppercase tracking-[0.14em]"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Top AI Insights
        </h2>
      </header>

      <div className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-8">
        {(isLoading ? Array.from({ length: 8 }).map((_, i) => ({
          id: `sk-${i}`, tone: 'neutral' as InsightTone, title: '—', detail: '', metric: '',
        })) : insights).map((it) => (
          <InsightCard key={it.id} insight={it} />
        ))}
      </div>
    </section>
  );
}

function InsightCard({ insight }: { insight: Insight }) {
  const meta = TONE_META[insight.tone];
  const MetricIcon = insight.metric ? METRIC_ICON[insight.metric] ?? Info : Info;
  return (
    <div
      className="rounded-xl border bg-white px-3 py-2.5"
      style={{ borderColor: meta.border }}
    >
      <div className="flex items-center gap-1.5">
        <span
          className="flex h-6 w-6 items-center justify-center rounded-md"
          style={{ background: meta.bg, color: meta.fg }}
        >
          <MetricIcon size={12} />
        </span>
        <span
          className="text-[9px] font-bold uppercase tracking-[0.12em]"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          {insight.metric ?? 'Insight'}
        </span>
      </div>
      <div
        className="mt-1.5 text-[12.5px] font-semibold leading-tight"
        style={{ color: 'var(--color-text-primary)' }}
      >
        {insight.title}
      </div>
      <div
        className="mt-1 text-[10.5px] leading-snug"
        style={{ color: meta.fg }}
      >
        {insight.detail}
      </div>
    </div>
  );
}
