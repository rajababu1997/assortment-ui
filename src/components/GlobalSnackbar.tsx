import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, AlertTriangle, XCircle, Info, type LucideIcon } from 'lucide-react';
import { subscribeSnackbar, snackbar } from '@/lib/snackbar';
import type { SnackbarMessage } from '@/lib/snackbar';

/**
 * GlobalSnackbar — bottom-center validation notification bar.
 *
 * Mounted once in AppProviders. Subscribes to snackbar service.
 * Gmail/Linear-inspired design: slides up from bottom, auto-dismisses.
 *
 * Severity styles:
 *   warn  → amber (validation errors like "From Date should be less than To Date")
 *   error → red   (hard validation errors like "Invalid file format")
 *   info  → blue  (informational hints like "Please select at least one item")
 */

const SEVERITY_STYLES: Record<string, { bg: string; border: string; text: string; icon: LucideIcon; iconColor: string }> = {
  warn: {
    bg: 'bg-amber-50 dark:bg-amber-950/90',
    border: 'border-amber-200 dark:border-amber-800',
    text: 'text-amber-800 dark:text-amber-200',
    icon: AlertTriangle,
    iconColor: 'text-amber-500',
  },
  error: {
    bg: 'bg-red-50 dark:bg-red-950/90',
    border: 'border-red-200 dark:border-red-800',
    text: 'text-red-800 dark:text-red-200',
    icon: XCircle,
    iconColor: 'text-red-500',
  },
  info: {
    bg: 'bg-blue-50 dark:bg-blue-950/90',
    border: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-800 dark:text-blue-200',
    icon: Info,
    iconColor: 'text-blue-500',
  },
};

export function GlobalSnackbar() {
  const [message, setMessage] = useState<SnackbarMessage | null>(null);

  useEffect(() => subscribeSnackbar(setMessage), []);

  const handleDismiss = useCallback(() => snackbar.dismiss(), []);

  const style = message ? SEVERITY_STYLES[message.severity] ?? SEVERITY_STYLES.info : SEVERITY_STYLES.info;
  const IconComponent = style.icon;

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          key={message.id}
          initial={{ y: 80, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 40, opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[10060] max-w-[90vw]"
        >
          <div className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border shadow-lg backdrop-blur-sm ${style.bg} ${style.border}`}>
            <IconComponent size={14} strokeWidth={2} className={`${style.iconColor} shrink-0`} />
            <span className={`text-sm font-medium ${style.text} whitespace-nowrap`}>
              {message.message}
            </span>
            <button
              onClick={handleDismiss}
              className={`shrink-0 ml-1 flex items-center justify-center w-5 h-5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors ${style.text}`}
              aria-label="Dismiss"
            >
              <X size={9} strokeWidth={2} />
            </button>
          </div>

          {/* Progress bar — shows remaining time */}
          <motion.div
            initial={{ scaleX: 1 }}
            animate={{ scaleX: 0 }}
            transition={{ duration: message.duration / 1000, ease: 'linear' }}
            className={`h-0.5 mt-0.5 mx-2 rounded-full origin-left ${style.iconColor.replace('text-', 'bg-')} opacity-40`}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
