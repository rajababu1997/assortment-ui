/**
 * TpsStatusBadge — Colored status indicator pill.
 *
 * Reusable across: View Camera, View Facility, Task Management, etc.
 * Shows a colored dot + label text in a rounded pill.
 */

interface Props {
  label: string;
  variant?: 'success' | 'danger' | 'warning' | 'info' | 'secondary';
}

const VARIANT_CLASSES: Record<string, { bg: string; text: string; dot: string }> = {
  success:   { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-400', dot: 'bg-green-500' },
  danger:    { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-400', dot: 'bg-red-500' },
  warning:   { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-800 dark:text-amber-400', dot: 'bg-amber-500' },
  info:      { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-400', dot: 'bg-blue-500' },
  secondary: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-300', dot: 'bg-gray-500' },
};

export function TpsStatusBadge({ label, variant = 'secondary' }: Props) {
  const v = VARIANT_CLASSES[variant] ?? VARIANT_CLASSES.secondary;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${v.bg} ${v.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${v.dot}`} />
      {label}
    </span>
  );
}
