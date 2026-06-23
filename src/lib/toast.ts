/**
 * Global toast notification service — top-right action result messages.
 *
 * 3-tier notification architecture:
 *   1. snackbar.warn()  → validation errors, bottom-center, auto-dismiss 4s
 *   2. toast.success()  → action results, top-right, auto-dismiss 3s (this file)
 *   3. confirmDialog()  → destructive actions, modal, requires user action
 *
 * Usage:
 *   import { toast } from '@/lib/toast';
 *   toast.success('User created successfully');
 *   toast.error('Failed to save changes');
 *   toast.info('Exporting data...');
 */

type Severity = 'success' | 'info' | 'warn' | 'error';
type Listener = (_toasts: ToastMessage[]) => void;

export interface ToastMessage {
  id: number;
  severity: Severity;
  message: string;
  duration: number;
  sticky?: boolean;
}

export interface ToastOptions {
  /** Duration in ms. Default: 3000 for success/info, 5000 for warn/error */
  life?: number;
  /** Sticky — stays until manually dismissed */
  sticky?: boolean;
  /** Summary/title override (not used in new design, kept for API compat) */
  summary?: string;
}

let idCounter = 0;
let toasts: ToastMessage[] = [];
const listeners: Set<Listener> = new Set();

function notify() {
  listeners.forEach((fn) => fn([...toasts]));
}

function addToast(severity: Severity, message: string, options?: ToastOptions) {
  const defaultLife = {
    success: 4000,
    info: 3500,
    warn: 6000,
    error: 6000,
  }[severity];
  const duration = options?.life ?? defaultLife;
  const msg: ToastMessage = { id: ++idCounter, severity, message, duration, sticky: options?.sticky };

  toasts = [...toasts, msg];
  notify();

  if (!options?.sticky) {
    setTimeout(() => {
      removeToast(msg.id);
    }, duration);
  }
}

function removeToast(id: number) {
  toasts = toasts.filter((t) => t.id !== id);
  notify();
}

export const toast = {
  success: (message: string, options?: ToastOptions) => addToast('success', message, options),
  info: (message: string, options?: ToastOptions) => addToast('info', message, options),
  warn: (message: string, options?: ToastOptions) => addToast('warn', message, options),
  error: (message: string, options?: ToastOptions) => addToast('error', message, options),
  dismiss: (id: number) => removeToast(id),
  clear: () => {
    toasts = [];
    notify();
  },
};

/** Subscribe to toast state changes (used by GlobalToast component) */
export function subscribeToast(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** @deprecated — no longer needed. Kept for backward compat, does nothing. */
export function setToastRef(_ref: unknown) {
  /* no-op */
}
