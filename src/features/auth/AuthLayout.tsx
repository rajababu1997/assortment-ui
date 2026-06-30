import { type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Layers, Palette, TrendingUp } from 'lucide-react';
import { environment } from '@/config/environment';
import { ConstellationBg } from './ConstellationBg';
import { AppLogo } from './AppLogo';

interface Props {
  children: ReactNode;
}

const FEATURES = [
  { icon: Layers, title: 'Layered Planning', text: 'OTB → Value → Option, in one cascade' },
  { icon: Palette, title: 'Range & Design', text: 'Line list to designer brief, locked to plan' },
] as const;

const LINKS = [
  { label: 'Terms', url: '#' },
  { label: 'Privacy', url: '#' },
  { label: 'Contact Us', url: '#' },
];

const CONTAINER = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.2 } },
};
const ITEM = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] } },
};
const CARD_ANIM = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.15, ease: [0.25, 0.1, 0.25, 1] } },
};

/**
 * AuthLayout — dark immersive full-screen auth layout.
 *
 * Desktop (>=lg): brand panel left + dark glass form card right
 * Tablet (md–lg): dark bg, centered card, no brand text
 * Mobile (<md): dark bg, full-width card, logo above
 */
export function AuthLayout({ children }: Props) {
  const subTitle = environment.appSubtitle || 'Plan. Range. Sell.';
  const poweredBy = environment.poweredBy || environment.appTitle;
  const copyrights = environment.copyrights;

  return (
    <div className="relative min-h-screen overflow-y-auto overflow-x-hidden bg-gradient-to-br from-[#0a0e1a] via-[#131832] to-[#0a0e1a]">
      <div className="absolute inset-0 z-[1]">
        <ConstellationBg />
      </div>

      <div className="relative z-[2] flex min-h-screen">
        {/* Brand panel (desktop only) */}
        <motion.div
          variants={CONTAINER}
          initial="hidden"
          animate="visible"
          className="hidden flex-col justify-between p-10 lg:flex lg:w-[55%] xl:p-14"
        >
          <motion.div variants={ITEM}>
            <AppLogo size="lg" />
          </motion.div>

          <div className="max-w-xl">
            <motion.p
              variants={ITEM}
              className="mb-5 text-md font-semibold uppercase tracking-[0.2em]"
              style={{
                background: 'linear-gradient(90deg, #60a5fa, #a78bfa)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {environment.appTitle}
            </motion.p>
            <motion.h1
              variants={ITEM}
              className="mb-5 text-4xl font-extrabold leading-[1.15] tracking-tight text-white xl:text-[3.25rem]"
            >
              {subTitle}
            </motion.h1>
            <motion.p variants={ITEM} className="mb-8 max-w-md text-md leading-relaxed text-slate-400">
              End-to-end merchandise planning for fashion retail — from annual budgets to in-season release.
            </motion.p>

            <div className="space-y-3">
              {FEATURES.map(({ icon: Icon, title, text }) => (
                <motion.div
                  key={title}
                  variants={ITEM}
                  className="flex items-start gap-3 rounded-xl p-3 transition-colors"
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                  }}
                >
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                    style={{ background: 'linear-gradient(135deg, rgba(96,165,250,0.15), rgba(167,139,250,0.15))' }}
                  >
                    <Icon className="h-4 w-4 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{title}</p>
                    <p className="text-sm leading-snug text-slate-400">{text}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <motion.div variants={ITEM} className="space-y-4">
            <ul className="flex items-center gap-8">
              {LINKS.map(({ label, url }) => (
                <li key={label}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cursor-pointer text-md text-slate-400 transition-colors hover:text-white"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
            {copyrights && <p className="text-md text-slate-400">{copyrights}</p>}
          </motion.div>
        </motion.div>

        {/* Form card panel */}
        <div className="flex flex-1 items-center justify-center p-4 py-8 sm:p-6 sm:py-10 lg:p-10">
          <motion.div
            variants={CARD_ANIM}
            initial="hidden"
            animate="visible"
            className="w-full max-w-md rounded-2xl border border-white/[0.15] p-6 backdrop-blur-2xl sm:p-8 lg:max-w-[28rem] lg:p-10"
            style={{
              background: 'rgba(12, 16, 36, 0.85)',
              boxShadow:
                '0 0 0 1px rgba(255,255,255,0.1), 0 12px 40px rgba(0,0,0,0.6), 0 0 100px rgba(60, 90, 220, 0.08)',
            }}
          >
            {/* Mobile/tablet app brand (hidden on lg+) */}
            <div className="mb-4 flex justify-center lg:hidden">
              <AppLogo size="sm" />
            </div>

            {children}

            <div className="mt-8 border-t border-white/[0.1] pt-4 text-center">
              <span className="text-md text-slate-500">{poweredBy}</span>
            </div>
          </motion.div>
        </div>
      </div>

      {copyrights && (
        <div className="relative z-[2] pb-4 text-center lg:hidden">
          <p className="text-md text-slate-400">{copyrights}</p>
        </div>
      )}
    </div>
  );
}
