/**
 * Floating stat strip — overlaps the hero bottom by -mt-12 to create depth.
 * Glass cards on a neutral surface; numbers animate up on mount.
 */

import { motion } from 'framer-motion';
import { Layers, CalendarClock, TrendingUp, Palette, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { CountUp } from './CountUp';

export type StatTone = 'primary' | 'success' | 'warning' | 'info';

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

interface Props {
  stats: Stat[];
}

const TONE_GRAD: Record<StatTone, string> = {
  primary: 'linear-gradient(135deg, rgba(96,165,250,0.18), rgba(167,139,250,0.18))',
  success: 'linear-gradient(135deg, rgba(16,185,129,0.18), rgba(52,211,153,0.18))',
  warning: 'linear-gradient(135deg, rgba(245,158,11,0.20), rgba(251,191,36,0.20))',
  info:    'linear-gradient(135deg, rgba(56,189,248,0.18), rgba(125,211,252,0.18))',
};

const TONE_FG: Record<StatTone, string> = {
  primary: '#2176ff',
  success: '#10b981',
  warning: '#f59e0b',
  info:    '#0ea5e9',
};

const ICONS = [Layers, CalendarClock, TrendingUp, Palette] as const;

const ITEM = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.25, 0.1, 0.25, 1] } },
};

export function StatStrip({ stats }: Props) {
  return (
    <motion.section
      variants={ITEM}
      className="relative z-[2] -mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      {stats.map((s, i) => {
        const Icon = ICONS[i % ICONS.length];
        const fg = TONE_FG[s.tone];
        return (
          <div
            key={s.label}
            className="group rounded-2xl border p-5 backdrop-blur-xl transition-all hover:-translate-y-1 hover:shadow-xl"
            style={{
              background: 'color-mix(in srgb, var(--color-surface) 92%, transparent)',
              borderColor: 'var(--color-divider)',
              boxShadow: '0 12px 30px -16px rgba(0,0,0,0.18)',
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--color-text-secondary)' }}>
                  {s.label}
                </p>
                <p className="mt-2.5 text-3xl font-bold leading-none tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
                  {s.prefix}
                  <CountUp value={s.value} formatter={s.formatter} />
                  {s.suffix}
                </p>
                {s.delta && (
                  <span
                    className="mt-3 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
                    style={{
                      background:
                        s.deltaTone === 'up'
                          ? 'rgba(16,185,129,0.12)'
                          : s.deltaTone === 'down'
                            ? 'rgba(239,68,68,0.12)'
                            : 'color-mix(in srgb, var(--color-text-secondary) 12%, transparent)',
                      color:
                        s.deltaTone === 'up' ? '#059669' : s.deltaTone === 'down' ? '#dc2626' : 'var(--color-text-secondary)',
                    }}
                  >
                    {s.deltaTone === 'up' ? (
                      <ArrowUpRight size={12} />
                    ) : s.deltaTone === 'down' ? (
                      <ArrowDownRight size={12} />
                    ) : (
                      <Minus size={12} />
                    )}
                    {s.delta}
                  </span>
                )}
              </div>
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-transform group-hover:scale-110"
                style={{
                  background: TONE_GRAD[s.tone],
                  border: `1px solid ${TONE_GRAD[s.tone]}`,
                }}
              >
                <Icon size={20} style={{ color: fg }} strokeWidth={1.6} />
              </div>
            </div>
          </div>
        );
      })}
    </motion.section>
  );
}
