/**
 * Reusable cell render functions for TpsDataTable columns.
 * Pass these as the `render` prop in ColumnConfig.
 *
 * Usage:
 *   import { renderFacilityPill, renderStatusDot, renderTypePill } from '@/components/tps-data-table';
 *
 *   { field: 'facilityName', header: 'Facility', render: renderFacilityPill }
 *   { field: 'deviceType',   header: 'Device Type', render: renderTypePill }
 *   { field: 'statusText',   header: 'Status', render: renderStatusDot((row) => row.isActive) }
 */

import type { ReactNode } from 'react';

const EMPTY = <span style={{ color: '#94A3B8' }}>—</span>;

// ── Base pill style (matches Figma Badge spec) ────────────────────────────────
// font: Inter 400 10px/12px  |  padding: 4px 8px  |  radius: 999px

interface PillStyle {
  bg: string;
  color: string;
}

function Pill({ value, style, dot }: { value: string; style: PillStyle; dot?: boolean }) {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: dot ? 5 : undefined,
      background: style.bg,
      color: style.color,
      borderRadius: 4,
      padding: '4px 8px',
      fontSize: 12,
      fontWeight: 600,
      lineHeight: '15px',
      fontFamily: 'Inter, system-ui, sans-serif',
      whiteSpace: 'nowrap',
      boxSizing: 'border-box',
    }}>
      {dot && (
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: style.color, flexShrink: 0 }} />
      )}
      {value}
    </span>
  );
}

/** Generic pill renderer — supply your own bg/color */
export function renderPill(bg: string, color: string) {
  return (value: any): ReactNode =>
    value ? <Pill value={String(value)} style={{ bg, color }} /> : EMPTY;
}

// ── Preset pills ─────────────────────────────────────────────────────────────

/** Blue pill — Facility names, locations */
export function renderFacilityPill(value: any): ReactNode {
  return value
    ? <Pill value={String(value)} style={{ bg: '#E9F1FF', color: '#1E6BE8' }} />
    : EMPTY;
}

/** Purple pill — Device types, categories */
export function renderTypePill(value: any): ReactNode {
  return value
    ? <Pill value={String(value)} style={{ bg: 'rgba(124, 58, 237, 0.10)', color: '#7C3AED' }} />
    : EMPTY;
}

/** Teal pill — Zones, channels */
export function renderZonePill(value: any): ReactNode {
  return value
    ? <Pill value={String(value)} style={{ bg: 'rgba(8, 145, 178, 0.10)', color: '#0891B2' }} />
    : EMPTY;
}

/** Amber pill — Tags, roles */
export function renderTagPill(value: any): ReactNode {
  return value
    ? <Pill value={String(value)} style={{ bg: 'rgba(217, 119, 6, 0.10)', color: '#D97706' }} />
    : EMPTY;
}

// ── Status dot + label ───────────────────────────────────────────────────────

/**
 * renderStatusDot — dot + label badge.
 *
 * @param isActive  Returns true for the "positive/active" state (green). False = danger (red).
 *
 * Example:
 *   render: renderStatusDot((row) => row.status === 3)
 *   render: renderStatusDot((row) => row.isActive)
 */
export function renderStatusDot<T = any>(isActive: (row: T) => boolean) {
  return (value: any, row: T): ReactNode => {
    if (!value) return EMPTY;
    const active = isActive(row);
    const style: PillStyle = active
      ? { bg: '#C9F3D7', color: '#00944A' }
      : { bg: '#FFE2E2', color: '#D10000' };
    return <Pill value={String(value)} style={style} dot />;
  };
}

/**
 * renderStatusMap — maps a value to a specific color.
 *
 * @param colorMap  Record of value → { bg, color }
 *
 * Example:
 *   render: renderStatusMap({
 *     Active:   { bg: 'rgba(0, 185, 65, 0.10)',  color: '#00B941' },
 *     Inactive: { bg: 'rgba(220, 38, 38, 0.10)', color: '#DC2626' },
 *     Pending:  { bg: 'rgba(217, 119, 6, 0.10)', color: '#D97706' },
 *   })
 */
export function renderStatusMap(colorMap: Record<string, PillStyle>) {
  return (value: any): ReactNode => {
    if (!value) return EMPTY;
    const str   = String(value);
    const style = colorMap[str];
    if (!style) return <span style={{ color: '#64748B', fontSize: 10 }}>{str}</span>;
    return <Pill value={str} style={style} dot />;
  };
}

// ── Boolean yes/no ───────────────────────────────────────────────────────────

/** Green "Yes" / gray "No" pill for boolean fields */
export function renderYesNo(value: any): ReactNode {
  const yes = value === true || value === 1 || value === 'true' || value === 'Yes';
  return (
    <Pill
      value={yes ? 'Yes' : 'No'}
      style={yes
        ? { bg: 'rgba(0, 185, 65, 0.10)',  color: '#00B941' }
        : { bg: '#EFF1F4',                  color: '#29313C' }
      }
      dot
    />
  );
}
