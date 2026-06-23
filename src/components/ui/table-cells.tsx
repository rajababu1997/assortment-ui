import { useState, type MouseEvent } from 'react';
import { UserRound, Mail, Phone, Copy, Check } from 'lucide-react';

// ── Shared helpers ────────────────────────────────────────────────────────────

const EMPTY_MARKERS = new Set(['not-entered', '', 'n/a', 'null', 'undefined']);

export function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  return EMPTY_MARKERS.has(String(value).toLowerCase().trim());
}

// ── Shared border/bg tokens (used as defaults — always overridable via props) ─

export const CELL_COLORS = {
  chipBg: '#F9FAFB',
  chipBorder: '#EAECF0',
  mutedText: '#98A2B3',
} as const;

// ── MutedDash ─────────────────────────────────────────────────────────────────

export function MutedDash() {
  return (
    <span style={{ color: CELL_COLORS.mutedText, fontSize: 14, fontWeight: 300 }} aria-label="Not available">
      —
    </span>
  );
}

// ── AvatarCell ────────────────────────────────────────────────────────────────
// Generic: any name field. Shows a deterministic colored initials circle + text.

export function AvatarCell({ value }: { value?: string }) {
  if (isEmpty(value)) return <MutedDash />;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center' }}>
        <UserRound size={15} color="#6366F1" strokeWidth={1.5} />
      </span>
      <span>{value}</span>
    </span>
  );
}

// ── ChipListCell ──────────────────────────────────────────────────────────────
// Generic: splits `value` by `delimiter` and renders each part as a chip.
// Stays on a single line — no wrapping.

interface ChipListCellProps {
  value?: string;
  delimiter?: string;
}

export function ChipListCell({ value, delimiter = ',' }: ChipListCellProps) {
  if (isEmpty(value)) return <MutedDash />;
  const chips = value!
    .split(delimiter)
    .map((c) => c.trim())
    .filter(Boolean);
  if (chips.length === 0) return <MutedDash />;
  return (
    <span style={{ display: 'inline-flex', flexWrap: 'nowrap', gap: 3, overflow: 'hidden', maxWidth: '100%' }}>
      {chips.map((chip) => (
        <span
          key={chip}
          style={{
            display: 'inline-block',
            padding: '1px 6px',
            borderRadius: 4,
            background: CELL_COLORS.chipBg,
            border: `1px solid ${CELL_COLORS.chipBorder}`,
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          {chip}
        </span>
      ))}
    </span>
  );
}

// ── ColorPillCell ─────────────────────────────────────────────────────────────
// Generic: renders a colored pill based on a caller-supplied value→color map.
// Falls back to plain text for unknown values.
//
// Usage:
//   <ColorPillCell value={gender} colorMap={{
//     Male:   { bg: '#DBEAFE', color: '#1D4ED8' },
//     Female: { bg: '#FCE7F3', color: '#9D174D' },
//   }} />

interface PillColor {
  bg: string;
  color: string;
}

interface ColorPillCellProps {
  value?: string;
  colorMap: Record<string, PillColor>;
  /** Match keys case-insensitively (default: true) */
  caseInsensitive?: boolean;
}

export function ColorPillCell({ value, colorMap, caseInsensitive = true }: ColorPillCellProps) {
  if (isEmpty(value)) return <MutedDash />;
  const key = caseInsensitive ? value!.toLowerCase() : value!;
  const mapKeys = caseInsensitive
    ? Object.fromEntries(Object.entries(colorMap).map(([k, v]) => [k.toLowerCase(), v]))
    : colorMap;
  const style = mapKeys[key];
  if (!style) return <span>{value}</span>;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '4px 8px',
        borderRadius: 4,
        background: style.bg,
        color: style.color,
        fontSize: 12,
        fontWeight: 600,
        fontFamily: 'Inter, system-ui, sans-serif',
        lineHeight: '15px',
        whiteSpace: 'nowrap',
      }}
    >
      {value}
    </span>
  );
}

// ── StatusPillCell ────────────────────────────────────────────────────────────
// Generic: soft pill with a leading status dot. Dot pulses when `pulse: true`.
// Caller supplies the full status→style map.
//
// Usage:
//   <StatusPillCell value={status} statusMap={{
//     Completed: { bg: '#DCFCE7', color: '#14532D', border: '#86EFAC', dot: '#16A34A' },
//     Pending:   { bg: '#FEF3C7', color: '#92400E', border: '#FCD34D', dot: '#D97706', pulse: true },
//   }} />

interface StatusColor {
  bg: string;
  color: string;
  border: string;
  dot: string;
  pulse?: boolean;
}

interface StatusPillCellProps {
  value?: string;
  statusMap: Record<string, StatusColor>;
  /** Show the leading status dot (default: false) */
  showDot?: boolean;
  /** Match keys case-insensitively (default: true) */
  caseInsensitive?: boolean;
}

export function StatusPillCell({ value, statusMap, showDot = false, caseInsensitive = true }: StatusPillCellProps) {
  if (isEmpty(value)) return <MutedDash />;
  const key = caseInsensitive ? value!.toLowerCase() : value!;
  const mapKeys = caseInsensitive
    ? Object.fromEntries(Object.entries(statusMap).map(([k, v]) => [k.toLowerCase(), v]))
    : statusMap;
  const config = mapKeys[key];
  if (!config) return <span>{value}</span>;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: showDot ? 5 : undefined,
        padding: '4px 8px',
        borderRadius: 4,
        background: config.bg,
        color: config.color,
        fontSize: 12,
        fontWeight: 600,
        fontFamily: 'Inter, system-ui, sans-serif',
        lineHeight: '15px',
        whiteSpace: 'nowrap',
      }}
      aria-label={value}
    >
      {showDot && (
        <span
          className={config.pulse ? 'animate-pulse' : undefined}
          style={{ width: 5, height: 5, borderRadius: '50%', background: config.dot, flexShrink: 0 }}
          aria-hidden="true"
        />
      )}
      {value}
    </span>
  );
}

// ── Legacy cells (unchanged — kept for backward compatibility) ────────────────

export function NameCell({ value }: { value: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center' }}>
        <UserRound size={15} color="#6366F1" strokeWidth={1.5} />
      </span>
      <span>{value}</span>
    </span>
  );
}

export function CopyEmailCell({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const [hovered, setHovered] = useState(false);

  const handleCopy = (e: MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  return (
    <span
      style={{ display: 'inline-flex', alignItems: 'center', gap: 5, maxWidth: '100%' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center' }}>
        <Mail size={13} color="#0EA5E9" strokeWidth={1.5} />
      </span>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</span>
      <button
        onClick={handleCopy}
        title={copied ? 'Copied!' : 'Copy email'}
        style={{
          flexShrink: 0,
          display: 'inline-flex',
          alignItems: 'center',
          background: 'none',
          border: 'none',
          padding: '2px',
          cursor: 'pointer',
          color: copied ? '#16a34a' : '#94A3B8',
          transition: 'color .15s, opacity .15s',
          opacity: hovered || copied ? 1 : 0,
          pointerEvents: hovered || copied ? 'auto' : 'none',
        }}
      >
        {copied ? <Check size={12} strokeWidth={2.5} /> : <Copy size={12} strokeWidth={1.8} />}
      </button>
    </span>
  );
}

export function PhoneCell({ value }: { value: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center' }}>
        <Phone size={13} color="#10B981" strokeWidth={1.5} />
      </span>
      <span>{value}</span>
    </span>
  );
}
