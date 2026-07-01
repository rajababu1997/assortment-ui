/**
 * Lifecycle journey — horizontal connected phase strip.
 *
 * Renders the merchandise lifecycle (Plan → Value → Option → Range → Buy → Sense)
 * as numbered nodes joined by a gradient connector. Live phases are clickable
 * and show a glow ring; "Soon" phases are dimmed.
 */

import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Calculator,
  BarChart3,
  Layers,
  Grid3x3,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';

interface Phase {
  id: string;
  step: string;
  title: string;
  description: string;
  icon: LucideIcon;
  href: string | null;
  status: 'live' | 'soon';
  needsSetup?: boolean;
}

const PHASES: Phase[] = [
  { id: 'otb',    step: '01', title: 'OTB Planning',    description: 'Annual budget. Periodic release.',          icon: Calculator,  href: '/otb',     status: 'live', needsSetup: true },
  { id: 'value',  step: '02', title: 'Value Planning',  description: 'MRP × cost cascade per released OTB.',      icon: Layers,      href: '/value',   status: 'live' },
  { id: 'option', step: '03', title: 'Option Planning', description: 'Fabric × Fit × Composition per band.',      icon: Grid3x3,     href: '/option',  status: 'live' },
  { id: 'final',  step: '04', title: 'Final Approval',  description: 'Admin closes each OTB after option plan.',  icon: ShieldCheck, href: '/otb/all', status: 'live' },
  { id: 'history',step: '05', title: 'Sales History',   description: 'YoY, occasion lifts, weekly velocity.',     icon: BarChart3,   href: '/saleshistory', status: 'live' },
];

const ITEM = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] } },
};

interface Props {
  setupComplete: boolean;
}

export function LifecycleNavigator({ setupComplete }: Props) {
  const navigate = useNavigate();

  return (
    <motion.section variants={ITEM}>
      <div className="mb-5 flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--color-primary)' }}>
            The merchandise lifecycle
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
            From budget envelope to in-store buy.
          </h2>
        </div>
      </div>

      {/* Horizontal scroll on mobile, grid on desktop */}
      <div className="relative">
        {/* Connector line behind the nodes */}
        <div
          aria-hidden
          className="absolute left-0 right-0 top-[44px] hidden h-px md:block"
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, rgba(96,165,250,0.45) 8%, rgba(167,139,250,0.45) 92%, transparent 100%)',
          }}
        />

        <div className="-mx-2 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 md:grid md:grid-cols-5 md:gap-3 md:overflow-visible">
          {PHASES.map((p, i) => {
            const Icon = p.icon;
            const disabled = p.status === 'soon' || !p.href;
            const blockedBySetup = p.needsSetup && !setupComplete;

            const onClick = () => {
              if (disabled) return;
              if (blockedBySetup) {
                navigate('/setup');
                return;
              }
              if (p.href) navigate(p.href);
            };

            return (
              <button
                key={p.id}
                type="button"
                onClick={onClick}
                disabled={disabled}
                className={`group relative mx-2 flex w-[260px] shrink-0 snap-start flex-col items-start gap-3 rounded-2xl border p-5 text-left transition-all md:mx-0 md:w-auto ${
                  disabled ? 'cursor-not-allowed' : 'cursor-pointer hover:-translate-y-1 hover:shadow-xl'
                }`}
                style={{
                  background: 'var(--color-surface)',
                  borderColor: 'var(--color-divider)',
                  opacity: disabled ? 0.78 : 1,
                  boxShadow: disabled ? 'none' : '0 1px 0 0 rgba(255,255,255,0.6) inset',
                  animationDelay: `${i * 60}ms`,
                }}
              >
                {/* Step pill */}
                <span
                  className="absolute -top-3 left-5 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-[0.16em]"
                  style={{
                    background: disabled
                      ? 'var(--color-surface-alt, #f8fafc)'
                      : 'linear-gradient(135deg, #60a5fa, #a78bfa)',
                    color: disabled ? 'var(--color-text-secondary)' : '#fff',
                    border: disabled ? '1px solid var(--color-divider)' : '1px solid transparent',
                    boxShadow: disabled ? 'none' : '0 4px 12px -4px rgba(96,165,250,0.5)',
                  }}
                >
                  {p.step}
                </span>

                {/* Status pill */}
                {p.status === 'soon' && (
                  <span
                    className="absolute right-4 top-4 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em]"
                    style={{
                      background: 'color-mix(in srgb, var(--color-text-secondary) 12%, transparent)',
                      color: 'var(--color-text-secondary)',
                    }}
                  >
                    Soon
                  </span>
                )}
                {blockedBySetup && (
                  <span
                    className="absolute right-4 top-4 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em]"
                    style={{ background: 'rgba(245,158,11,0.16)', color: '#b45309' }}
                  >
                    Setup
                  </span>
                )}

                <div
                  className="flex h-12 w-12 items-center justify-center rounded-xl transition-transform group-hover:scale-105"
                  style={{
                    background: disabled
                      ? 'color-mix(in srgb, var(--color-text-secondary) 8%, transparent)'
                      : 'linear-gradient(135deg, rgba(96,165,250,0.20), rgba(167,139,250,0.20))',
                    border: disabled ? '1px solid var(--color-divider)' : '1px solid rgba(96,165,250,0.25)',
                  }}
                >
                  <Icon
                    size={22}
                    strokeWidth={1.6}
                    style={{ color: disabled ? 'var(--color-text-secondary)' : '#2176ff' }}
                  />
                </div>

                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                    {p.title}
                  </p>
                  <p className="mt-0.5 text-xs leading-snug" style={{ color: 'var(--color-text-secondary)' }}>
                    {p.description}
                  </p>
                </div>

              </button>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
}
