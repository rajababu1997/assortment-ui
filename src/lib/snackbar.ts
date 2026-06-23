/**
 * Global snackbar notification service — bottom-center validation messages.
 *
 * 3-tier notification architecture:
 *   1. snackbar.warn()  → validation errors, bottom-center, auto-dismiss 4s
 *   2. toast.success()  → action results, top-right, auto-dismiss 3s
 *   3. confirmDialog()  → destructive actions, modal, requires user action
 *
 * Usage:
 *   import { snackbar } from '@/lib/snackbar';
 *   snackbar.warn('From Date should be less than To Date');
 *   snackbar.info('Please select at least one item');
 *   snackbar.error('Invalid file format. Only .png allowed');
 */

type Severity = 'info' | 'warn' | 'error';
type Listener = (msg: SnackbarMessage | null) => void;

export interface SnackbarMessage {
  id: number;
  severity: Severity;
  message: string;
  duration: number;
}

let idCounter = 0;
const listeners: Set<Listener> = new Set();
let currentMessage: SnackbarMessage | null = null;

function notify(msg: SnackbarMessage | null) {
  currentMessage = msg;
  listeners.forEach(fn => fn(msg));
}

function show(severity: Severity, message: string, duration = 4000) {
  const msg: SnackbarMessage = { id: ++idCounter, severity, message, duration };
  notify(msg);

  // Auto-dismiss
  setTimeout(() => {
    // Only dismiss if this message is still showing
    if (currentMessage?.id === msg.id) {
      notify(null);
    }
  }, duration);
}

export const snackbar = {
  info:  (message: string, duration?: number) => show('info', message, duration),
  warn:  (message: string, duration?: number) => show('warn', message, duration),
  error: (message: string, duration?: number) => show('error', message, duration),
  dismiss: () => notify(null),
};

/** Subscribe to snackbar state changes (used by GlobalSnackbar component) */
export function subscribeSnackbar(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
