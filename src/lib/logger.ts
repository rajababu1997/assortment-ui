/**
 * Structured logger with pluggable backend.
 *
 * - Dev: all levels log to browser console with timestamps + context
 * - Prod: error/warn log to console (and Sentry when plugged in)
 * - debug is stripped in prod via import.meta.env.DEV check
 *
 * To add Sentry later:
 *   import * as Sentry from '@sentry/react';
 *   logger.addTransport({ error: Sentry.captureException, warn: Sentry.captureMessage });
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

interface LogTransport {
  error?: (error: unknown, context?: LogContext) => void;
  warn?: (message: string, context?: LogContext) => void;
  info?: (message: string, context?: LogContext) => void;
  debug?: (message: string, context?: LogContext) => void;
}

const transports: LogTransport[] = [];

const isDev = import.meta.env.DEV;

function formatTimestamp(): string {
  return new Date().toISOString().slice(11, 23); // HH:mm:ss.SSS
}

const LEVEL_STYLES: Record<LogLevel, string> = {
  debug: 'color: #94a3b8',           // slate-400
  info:  'color: #3b82f6',           // blue-500
  warn:  'color: #f59e0b',           // amber-500
  error: 'color: #ef4444; font-weight: bold', // red-500
};

function consoleLog(level: LogLevel, message: string, context?: LogContext) {
  const timestamp = formatTimestamp();
  const prefix = `%c[${timestamp}] [${level.toUpperCase()}]`;

  if (context && Object.keys(context).length > 0) {
    console[level === 'debug' ? 'log' : level](prefix, LEVEL_STYLES[level], message, context);
  } else {
    console[level === 'debug' ? 'log' : level](prefix, LEVEL_STYLES[level], message);
  }
}

export const logger = {
  debug(message: string, context?: LogContext) {
    if (!isDev) return;
    consoleLog('debug', message, context);
    transports.forEach(t => t.debug?.(message, context));
  },

  info(message: string, context?: LogContext) {
    consoleLog('info', message, context);
    transports.forEach(t => t.info?.(message, context));
  },

  warn(message: string, context?: LogContext) {
    consoleLog('warn', message, context);
    transports.forEach(t => t.warn?.(message, context));
  },

  error(messageOrError: string | Error, context?: LogContext) {
    const message = messageOrError instanceof Error ? messageOrError.message : messageOrError;
    consoleLog('error', message, context);
    transports.forEach(t => t.error?.(messageOrError, context));
  },

  /** Add an external transport (e.g., Sentry). Call once at app init. */
  addTransport(transport: LogTransport) {
    transports.push(transport);
  },
};
