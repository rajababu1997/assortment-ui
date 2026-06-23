import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { subscribeToast, toast as toastService } from '@/lib/toast';
import type { ToastMessage } from '@/lib/toast';

/**
 * GlobalToast — Enterprise toast design inspired by shadcn/ui, Sonner, and Linear.
 * Clean, semantic, minimal shadows with soft tinted backgrounds and thin borders.
 *
 * Z-Index Strategy:
 *   - zIndex: 50000 places toasts above PrimeReact modals (1000-2000) and most overlays
 */

const VARIANTS = {
  success: {
    icon: '✓',
    light: {
      borderColor: 'rgba(34, 197, 94, 0.7)',
      backgroundColor: '#f0fdf4',
      iconBg: '#22c55e',
      iconColor: '#ffffff',
      textColor: '#18181b',
      messageColor: '#52525b',
    },
    dark: {
      borderColor: 'rgba(34, 197, 94, 0.7)',
      backgroundColor: 'rgba(34, 197, 94, 0.1)',
      iconBg: '#22c55e',
      iconColor: '#ffffff',
      textColor: '#e4e4e7',
      messageColor: '#a1a1a6',
    },
  },
  error: {
    icon: '✕',
    light: {
      borderColor: 'rgba(239, 68, 68, 0.7)',
      backgroundColor: '#fef2f2',
      iconBg: '#ef4444',
      iconColor: '#ffffff',
      textColor: '#18181b',
      messageColor: '#52525b',
    },
    dark: {
      borderColor: 'rgba(239, 68, 68, 0.7)',
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      iconBg: '#ef4444',
      iconColor: '#ffffff',
      textColor: '#e4e4e7',
      messageColor: '#a1a1a6',
    },
  },
  warn: {
    icon: '!',
    light: {
      borderColor: 'rgba(234, 179, 8, 0.75)',
      backgroundColor: '#fefce8',
      iconBg: '#eab308',
      iconColor: '#ffffff',
      textColor: '#18181b',
      messageColor: '#52525b',
    },
    dark: {
      borderColor: 'rgba(234, 179, 8, 0.75)',
      backgroundColor: 'rgba(234, 179, 8, 0.1)',
      iconBg: '#eab308',
      iconColor: '#ffffff',
      textColor: '#e4e4e7',
      messageColor: '#a1a1a6',
    },
  },
  info: {
    icon: 'i',
    light: {
      borderColor: 'rgba(59, 130, 246, 0.7)',
      backgroundColor: '#eff6ff',
      iconBg: '#3b82f6',
      iconColor: '#ffffff',
      textColor: '#18181b',
      messageColor: '#52525b',
    },
    dark: {
      borderColor: 'rgba(59, 130, 246, 0.7)',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      iconBg: '#3b82f6',
      iconColor: '#ffffff',
      textColor: '#e4e4e7',
      messageColor: '#a1a1a6',
    },
  },
} as const;

type VariantKey = keyof typeof VARIANTS;

const GENERIC_TITLES: Record<VariantKey, string> = {
  success: 'Success',
  error: 'Error',
  warn: 'Warning',
  info: 'Info',
};

function CloseButton({ onClick, isDark }: { onClick: () => void; isDark: boolean }) {
  const hoverBg = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)';

  return (
    <button
      onClick={onClick}
      style={{
        width: 30,
        height: 30,
        border: 'none',
        background: 'transparent',
        borderRadius: 6,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: '0.2s ease',
        flexShrink: 0,
        padding: 0,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = hoverBg;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
      }}
      aria-label="Dismiss notification"
    >
      <svg
        width={18}
        height={18}
        viewBox="0 0 24 24"
        fill="none"
        stroke="#71717a"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6 6L18 18M18 6L6 18" />
      </svg>
    </button>
  );
}

function ToastCard({ toast, onDismiss, isDark }: { toast: ToastMessage; onDismiss: () => void; isDark: boolean }) {
  const variant = VARIANTS[(toast.severity as VariantKey) ?? 'info'];
  const theme = isDark ? variant.dark : variant.light;

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 8px 10px 12px',
        borderRadius: 18,
        border: `1.5px solid ${theme.borderColor}`,
        background: theme.backgroundColor,
        transition: '0.25s ease',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
        maxWidth: 'calc(100vw - 40px)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-1px)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.04)';
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: theme.iconBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          color: theme.iconColor,
          fontSize: 18,
          fontWeight: 600,
          lineHeight: 1,
        }}
      >
        {variant.icon}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0, marginRight: 8, maxWidth: '100%' }}>
        {/* Extract title and message from toast.message */}
        {(() => {
          const hasNewline = toast.message.includes('\n');
          let title: string;
          let message: string;

          if (hasNewline) {
            // User provided explicit title\nmessage
            const lines = toast.message.split('\n');
            title = lines[0];
            message = lines.slice(1).join('\n');
          } else {
            // Auto-generate generic title
            title = GENERIC_TITLES[toast.severity as VariantKey] || 'Info';
            message = toast.message;
          }

          return (
            <>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: theme.textColor,
                  marginBottom: 3,
                  fontFamily: "'Inter', sans-serif",
                  lineHeight: 1.3,
                }}
              >
                {title}
              </div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 500,
                  lineHeight: 1.4,
                  color: theme.messageColor,
                  fontFamily: "'Inter', sans-serif",
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                }}
              >
                {message}
              </div>
            </>
          );
        })()}
      </div>

      {/* Close Button */}
      <CloseButton onClick={onDismiss} isDark={isDark} />
    </div>
  );
}

export function GlobalToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const { isDark } = useTheme();

  useEffect(() => subscribeToast(setToasts), []);

  const handleDismiss = useCallback((id: number) => toastService.dismiss(id), []);

  return (
    <div
      style={{
        position: 'fixed',
        top: 72,
        right: 20,
        zIndex: 50000,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        pointerEvents: 'none',
        maxWidth: 'calc(100vw - 40px)',
      }}
    >
      <AnimatePresence mode="popLayout">
        {toasts.slice(-4).map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ x: 32, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 32, opacity: 0, scale: 0.95 }}
            transition={{
              type: 'spring',
              stiffness: 350,
              damping: 35,
              mass: 0.5,
            }}
            style={{ pointerEvents: 'auto' }}
          >
            <ToastCard toast={t} onDismiss={() => handleDismiss(t.id)} isDark={isDark} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
