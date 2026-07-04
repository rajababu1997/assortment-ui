/**
 * Consistent green/gray/red pill for the "AI Recommendation" column that
 * shows on every table on the page.
 */

type Reco = 'Increase' | 'Maintain' | 'Reduce' | 'Reduce Slightly';

const TONE: Record<Reco, { fg: string; bg: string; dot: string }> = {
  Increase:         { fg: '#047857', bg: 'rgba(16,185,129,0.14)',  dot: '#10b981' },
  Maintain:         { fg: '#475569', bg: 'rgba(148,163,184,0.18)', dot: '#94a3b8' },
  'Reduce Slightly':{ fg: '#b45309', bg: 'rgba(245,158,11,0.16)',  dot: '#f59e0b' },
  Reduce:           { fg: '#b91c1c', bg: 'rgba(239,68,68,0.14)',   dot: '#ef4444' },
};

export function RecommendationChip({ label }: { label: Reco | null | undefined }) {
  if (!label) {
    return <span className="text-[11.5px]" style={{ color: 'var(--color-text-tertiary)' }}>—</span>;
  }
  const t = TONE[label];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold"
      style={{ background: t.bg, color: t.fg }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: t.dot }} />
      {label}
    </span>
  );
}
