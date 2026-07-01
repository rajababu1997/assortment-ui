/**
 * "Why these numbers?" info icon for the three editor headers.
 *
 * Session-only: only renders when a recommendation was generated during
 * the current page session. Click → opens the explanation drawer the
 * parent owns. Tooltip carries the "Generated N min ago" timestamp.
 */

import { Info } from 'lucide-react';

export function WhyAiButton({
  generatedAtMs,
  onClick,
}: {
  generatedAtMs: number;
  onClick: () => void;
}) {
  const stamp = fmtGeneratedAt(generatedAtMs);
  return (
    <button
      type="button"
      onClick={onClick}
      title={`Why these numbers? · Generated ${stamp}`}
      aria-label={`Show system explanation. Generated ${stamp}.`}
      className="flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-[var(--color-surface-alt,#f1f5f9)]"
      style={{ color: 'var(--color-primary)' }}
    >
      <Info size={15} />
    </button>
  );
}

function fmtGeneratedAt(generatedAtMs: number): string {
  const deltaMs = Date.now() - generatedAtMs;
  if (deltaMs < 60_000) return 'just now';
  if (deltaMs < 60 * 60_000) return `${Math.floor(deltaMs / 60_000)} min ago`;
  return `${Math.floor(deltaMs / (60 * 60_000))} hr ago`;
}
