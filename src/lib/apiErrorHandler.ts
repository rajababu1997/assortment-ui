/**
 * Centralized API error handler for Axios response interceptor.
 *
 * Normalizes all API errors into a consistent shape and logs them.
 * NO toast calls — component decides what to show (or shows nothing).
 * Only exception: 401 → auto-redirect handled in axios.ts interceptor.
 */

import type { AxiosError } from 'axios';
import { logger } from '@/lib/logger';

/** Normalized API error shape returned to callers */
export interface ApiError {
  message: string;
  status: number;
  code: string;
  details?: Record<string, string[]>;  // field-level validation errors
  original: AxiosError;
}

/** Error messages by HTTP status */
const STATUS_MESSAGES: Record<number, string> = {
  400: 'Invalid request',
  401: 'Session expired. Please sign in again.',
  403: 'Access denied. You don\'t have permission for this action.',
  404: 'Resource not found',
  408: 'Request timed out',
  409: 'Conflict — this resource was modified by another user',
  422: 'Validation failed',
  429: 'Too many requests. Please try again later.',
  500: 'Server error. Please try again later.',
  502: 'Service temporarily unavailable',
  503: 'Service temporarily unavailable',
};

/**
 * Handle Axios response errors. Called from the response interceptor.
 * Returns a rejected promise with a normalized ApiError.
 *
 * No toast — component's onSuccess/onError decides what to display.
 */
export function handleApiError(error: AxiosError): Promise<never> {
  // Network error (no response received)
  if (!error.response) {
    const message = error.code === 'ECONNABORTED'
      ? 'Request timed out. Check your connection.'
      : 'Connection lost. Please check your network.';

    logger.error('Network error', {
      code: error.code,
      message: error.message,
      url: error.config?.url,
    });

    return Promise.reject({
      message,
      status: 0,
      code: error.code ?? 'NETWORK_ERROR',
      original: error,
    } as ApiError);
  }

  const status = error.response.status;
  const data = error.response.data as Record<string, unknown> | undefined;
  const serverMessage = (data?.message ?? data?.error ?? data?.detail) as string | undefined;
  const message = serverMessage ?? STATUS_MESSAGES[status] ?? `Unexpected error (${status})`;

  // Build normalized error
  const apiError: ApiError = {
    message,
    status,
    code: (data?.code as string) ?? `HTTP_${status}`,
    details: data?.errors as Record<string, string[]> | undefined,
    original: error,
  };

  // Log by severity (no toast)
  switch (status) {
    case 401:
      logger.warn('Unauthorized — session expired', { url: error.config?.url });
      break;
    case 403:
      logger.warn('Forbidden', { url: error.config?.url, status });
      break;
    case 422:
      logger.debug('Validation error', { url: error.config?.url, details: apiError.details });
      break;
    case 429:
      logger.warn('Rate limited', { url: error.config?.url });
      break;
    default:
      if (status >= 500) {
        logger.error('Server error', { url: error.config?.url, status, message });
      } else if (status >= 400) {
        logger.warn('Client error', { url: error.config?.url, status, message });
      }
  }

  return Promise.reject(apiError);
}
