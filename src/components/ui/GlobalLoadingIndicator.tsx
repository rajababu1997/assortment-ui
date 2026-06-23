/**
 * GlobalLoadingIndicator — automatic loading feedback for all TanStack Query calls.
 *
 * A3 strategy:
 *   Queries  → thin top progress bar (non-blocking)
 *   Mutations → full overlay spinner (blocks UI, prevents double-clicks)
 *
 * Mount once in AppProviders — zero per-page wiring needed.
 */
import { useIsFetching, useIsMutating } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export function GlobalLoadingIndicator() {
  const fetchingCount = useIsFetching();
  const mutatingCount = useIsMutating();

  const showProgressBar = fetchingCount > 0;
  const showOverlay = mutatingCount > 0;

  return (
    <>
      {/* ── Top Progress Bar (queries) ─────────────────────────────────── */}
      <AnimatePresence>
        {showProgressBar && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              height: '3px',
              zIndex: 1500,
              overflow: 'hidden',
              background: 'var(--color-primary-100, #e2ecfd)',
            }}
          >
            {/* Sliding strip — short glowing bar that races across */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                height: '100%',
                width: '40%',
                borderRadius: '0 2px 2px 0',
                background: 'linear-gradient(90deg, transparent, var(--color-primary, #1e88dc) 30%, var(--color-primary-400, #74b0f5) 60%, var(--color-primary, #1e88dc) 80%, transparent)',
                boxShadow: '0 0 10px var(--color-primary-400, #74b0f5), 0 0 5px var(--color-primary, #1e88dc)',
                animation: 'globalProgressSlide 1.2s cubic-bezier(0.4, 0, 0.2, 1) infinite',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Full Overlay Spinner (mutations) ────────────────────────────── */}
      <AnimatePresence>
        {showOverlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 1350,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              backgroundColor: 'rgba(255, 255, 255, 0.55)',
              backdropFilter: 'blur(2px)',
              pointerEvents: 'all',
            }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.05, type: 'spring', damping: 20, stiffness: 300 }}
            >
              <Loader2
                className="animate-spin"
                style={{
                  width: '36px',
                  height: '36px',
                  color: 'var(--color-primary, #1e88dc)',
                }}
              />
            </motion.div>
            <motion.span
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.2 }}
              style={{
                fontSize: '0.8125rem',
                fontWeight: 500,
                color: 'var(--color-text-secondary, #475569)',
                letterSpacing: '0.01em',
              }}
            >
              Processing…
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keyframes for progress bar shimmer */}
      <style>{`
        @keyframes globalProgressSlide {
          0%   { left: -40%; }
          100% { left: 100%; }
        }
      `}</style>
    </>
  );
}
