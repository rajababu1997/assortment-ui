import type { ReactNode } from 'react';

/**
 * Tag severity → Tailwind class map.
 * Matches Angular's PrimeNG p-tag severity colors (light pastel backgrounds).
 */
const SEVERITY_CLASSES: Record<string, string> = {
  success:   'bg-green-100 text-green-700',
  danger:    'bg-red-100 text-red-700',
  warning:   'bg-yellow-100 text-yellow-700',
  info:      'bg-blue-100 text-blue-700',
  secondary: 'bg-gray-100 text-gray-600',
};

const DEFAULT_CLASSES = 'bg-gray-100 text-gray-600';

/**
 * Reusable tag/badge component — React equivalent of Angular's
 * `CommonService.prepareTag(label, severity)`.
 *
 * Usage in data enrichment or cell renderers:
 *   prepareTag('Completed', 'success')
 *   prepareTag('Pending', 'danger')
 */
export function prepareTag(label: string, severity?: string): ReactNode {
  const cls = severity ? (SEVERITY_CLASSES[severity] ?? DEFAULT_CLASSES) : DEFAULT_CLASSES;
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${cls}`}>
      {label}
    </span>
  );
}
