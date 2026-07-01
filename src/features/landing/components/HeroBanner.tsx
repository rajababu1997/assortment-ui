/**
 * HERO — immersive dark gradient stage with mesh + animated orb.
 * Designed for the post-login "wow" moment in client demos.
 */

import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, Calendar, TrendingUp } from 'lucide-react';

const ITEM = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] } },
};

interface BriefRowData {
  label: string;
  value: string;
  tone?: 'up' | 'down' | 'accent' | 'neutral';
}

interface Props {
  firstName: string;
  todayMs: number;
  headline: string;
  summary: string;
  ringPct: number;
  ringSubtitle: string;
  briefRows: BriefRowData[];
  hasPlan: boolean;
}

export function HeroBanner({
  firstName,
  todayMs,
  headline,
  summary,
  ringPct,
  ringSubtitle,
  briefRows,
  hasPlan,
}: Props) {
  const navigate = useNavigate();
  const greeting = pickGreeting(todayMs);
  const dateLabel = new Date(todayMs).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <motion.section
      variants={ITEM}
      className="relative overflow-hidden rounded-3xl border border-white/10"
      style={{
        background:
          'linear-gradient(135deg, #0a0e1a 0%, #16204a 35%, #2a1d56 70%, #0a0e1a 100%)',
        boxShadow: '0 30px 80px -30px rgba(60, 90, 220, 0.45)',
      }}
    >
      {/* Mesh + orb decoration */}
      <MeshPattern />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 -top-32 h-[420px] w-[420px] rounded-full opacity-60 blur-3xl"
        style={{ background: 'radial-gradient(circle, #a78bfa 0%, transparent 65%)' }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-16 -bottom-24 h-[360px] w-[360px] rounded-full opacity-50 blur-3xl"
        style={{ background: 'radial-gradient(circle, #60a5fa 0%, transparent 65%)' }}
      />
      <FabricDrape />

      <div className="relative grid grid-cols-1 gap-8 p-8 md:p-12 lg:grid-cols-[1.4fr_1fr] lg:items-center">
        {/* Left — headline + CTA */}
        <div>
          <div className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-200 backdrop-blur-sm">
            <Calendar size={11} /> {dateLabel}
          </div>

          <p className="mb-2 text-sm font-medium uppercase tracking-[0.18em] text-blue-300">
            {greeting}, {firstName}
          </p>

          <h1 className="mb-4 max-w-2xl text-3xl font-extrabold leading-[1.1] tracking-tight text-white md:text-5xl">
            {headline.split(' — ').map((part, i, arr) => (
              <span key={i}>
                {i > 0 && (
                  <span
                    style={{
                      background: 'linear-gradient(90deg, #60a5fa, #a78bfa)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    {part}
                  </span>
                )}
                {i === 0 && <span>{part}</span>}
                {i < arr.length - 1 && (
                  <span className="text-slate-500"> — </span>
                )}
              </span>
            ))}
          </h1>

          <p className="mb-7 max-w-xl text-md leading-relaxed text-slate-300">{summary}</p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(hasPlan ? '/otb' : '/otb/annual')}
              className="group inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:-translate-y-0.5"
              style={{
                background: 'linear-gradient(135deg, #2176ff 0%, #a78bfa 100%)',
                boxShadow: '0 8px 28px -8px rgba(96, 165, 250, 0.55)',
              }}
            >
              {hasPlan ? 'Resume planning' : 'Create annual plan'}
              <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
            </button>
            <button
              type="button"
              onClick={() => navigate('/saleshistory')}
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-slate-100 backdrop-blur-sm transition-all hover:bg-white/[0.08]"
            >
              <TrendingUp size={14} /> Explore sales history
            </button>
          </div>
        </div>

        {/* Right — Today's brief glass widget */}
        <div
          className="relative rounded-2xl border border-white/15 p-6 backdrop-blur-xl"
          style={{
            background: 'rgba(12, 16, 36, 0.65)',
            boxShadow: '0 12px 48px rgba(0,0,0,0.45), inset 0 0 0 1px rgba(255,255,255,0.04)',
          }}
        >
          <div className="mb-4 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
              Today&apos;s brief
            </p>
            <Sparkles size={14} className="text-blue-300" />
          </div>

          <ProgressRing pct={ringPct} subtitle={ringSubtitle} />

          <div className="mt-5 space-y-3 border-t border-white/10 pt-4">
            {briefRows.map((r) => (
              <BriefRow key={r.label} label={r.label} value={r.value} tone={r.tone} />
            ))}
          </div>
        </div>
      </div>
    </motion.section>
  );
}

function ProgressRing({ pct, subtitle }: { pct: number; subtitle: string }) {
  const r = 38;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <div className="flex items-center gap-4">
      <svg width="96" height="96" viewBox="0 0 96 96" className="shrink-0">
        <defs>
          <linearGradient id="ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#a78bfa" />
          </linearGradient>
        </defs>
        <circle cx="48" cy="48" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
        <circle
          cx="48"
          cy="48"
          r={r}
          fill="none"
          stroke="url(#ring-grad)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          transform="rotate(-90 48 48)"
          style={{ transition: 'stroke-dashoffset 1.2s ease-out' }}
        />
      </svg>
      <div>
        <p className="text-3xl font-bold leading-none text-white">{pct}%</p>
        <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
      </div>
    </div>
  );
}

function BriefRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: 'up' | 'down' | 'accent' | 'neutral';
}) {
  const color =
    tone === 'up' ? '#34d399' :
    tone === 'down' ? '#f87171' :
    tone === 'accent' ? '#a5b4fc' :
    '#e2e8f0';
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-400">{label}</span>
      <span className="font-semibold" style={{ color }}>{value}</span>
    </div>
  );
}

function MeshPattern() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.08]"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id="mesh-dots" x="0" y="0" width="36" height="36" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1" fill="#a5b4fc" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#mesh-dots)" />
    </svg>
  );
}

/** Abstract garment-drape silhouette in the bottom-right corner. */
function FabricDrape() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute bottom-0 right-0 h-[280px] w-[420px] opacity-[0.10]"
      viewBox="0 0 420 280"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="drape" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#60a5fa" />
        </linearGradient>
      </defs>
      <path
        d="M0,280 C80,200 120,260 200,180 C260,120 320,200 420,80 L420,280 Z"
        fill="url(#drape)"
      />
      <path
        d="M40,280 C120,220 180,260 240,200 C300,140 360,220 420,140 L420,280 Z"
        fill="url(#drape)"
        opacity="0.5"
      />
    </svg>
  );
}

function pickGreeting(ms: number): string {
  const h = new Date(ms).getHours();
  if (h < 5) return 'Working late';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 21) return 'Good evening';
  return 'Good night';
}
