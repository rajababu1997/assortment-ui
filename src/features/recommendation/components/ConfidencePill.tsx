/**
 * Confidence pill — tiny chip the editor renders next to AI-populated fields
 * and inside the explanation drawer header.
 */

import type { ConfidenceLevel } from '../types';

const COLORS: Record<ConfidenceLevel, { bg: string; fg: string; label: string }> = {
  high:       { bg: 'rgba(22,163,74,0.12)',  fg: '#15803d', label: 'HIGH' },
  medium:     { bg: 'rgba(217,119,6,0.12)',  fg: '#b45309', label: 'MEDIUM' },
  low:        { bg: 'rgba(220,38,38,0.12)',  fg: '#b91c1c', label: 'LOW' },
  cold_start: { bg: 'rgba(100,116,139,0.12)', fg: '#475569', label: 'COLD START' },
};

export function ConfidencePill({ level, label }: { level: ConfidenceLevel; label?: string }) {
  const c = COLORS[level] ?? COLORS.medium;
  return (
    <span
      className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
      style={{ background: c.bg, color: c.fg }}
    >
      {label ?? c.label}
    </span>
  );
}
