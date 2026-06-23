/**
 * TpsEmptyState — enterprise empty-state renderer for TpsDataTable.
 *
 * Four variants, auto-selected by priority:
 *   1. Error       — API / load failure
 *   2. No Results  — search returned nothing
 *   3. Filtered    — active filters returned nothing
 *   4. No Data     — list is genuinely empty
 */

import { useState, type ReactNode, type CSSProperties } from 'react';
import {
  SearchX, SlidersHorizontal, AlertCircle,
  Plus, RotateCcw, X, ArrowRight, Filter,
} from 'lucide-react';
import type { ToolbarActionConfig } from './types';

// ── Custom empty-table SVG illustration ───────────────────────────────────────

function EmptyTableIcon({ color = '#2176FF' }: { color?: string }) {
  const soft = `${color}22`;
  const mid = `${color}55`;
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Table frame */}
      <rect x="2" y="5" width="30" height="24" rx="4" stroke={color} strokeWidth="1.6" />
      {/* Header row fill */}
      <rect x="2" y="5" width="30" height="8" rx="4" fill={soft} />
      <rect x="2" y="9" width="30" height="4" fill={soft} />
      {/* Header divider */}
      <line x1="2" y1="13" x2="32" y2="13" stroke={color} strokeWidth="1.4" />
      {/* Column dividers */}
      <line x1="13" y1="5" x2="13" y2="29" stroke={mid} strokeWidth="1" />
      <line x1="24" y1="5" x2="24" y2="29" stroke={mid} strokeWidth="1" />
      {/* Header dots */}
      <circle cx="7.5" cy="9" r="1.5" fill={color} opacity="0.7" />
      <circle cx="18.5" cy="9" r="1.5" fill={color} opacity="0.5" />
      <circle cx="28" cy="9" r="1.5" fill={color} opacity="0.35" />
      {/* Empty row 1 — dashed cells */}
      <line x1="5" y1="19.5" x2="10" y2="19.5" stroke={color} strokeWidth="1.4" strokeLinecap="round" opacity="0.35" />
      <line x1="16" y1="19.5" x2="21" y2="19.5" stroke={color} strokeWidth="1.4" strokeLinecap="round" opacity="0.25" />
      <line x1="26.5" y1="19.5" x2="30" y2="19.5" stroke={color} strokeWidth="1.4" strokeLinecap="round" opacity="0.2" />
      {/* Empty row 2 */}
      <line x1="5" y1="25" x2="8" y2="25" stroke={color} strokeWidth="1.4" strokeLinecap="round" opacity="0.2" />
      <line x1="16" y1="25" x2="20" y2="25" stroke={color} strokeWidth="1.4" strokeLinecap="round" opacity="0.15" />
    </svg>
  );
}

// ── Public types ───────────────────────────────────────────────────────────────

export interface TpsEmptyStateProps {
  isError?: boolean;
  errorMessage?: string;
  isFiltered?: boolean;
  isSearching?: boolean;
  searchText?: string;
  activeChips?: string[];
  onClear?: () => void;
  onRetry?: () => void;
  onAdd?: () => void;
  onSecondary?: () => void;
  secondaryLabel?: string;
  entityName?: string;
  entityNamePlural?: string;
  description?: string;
  icon?: ReactNode;
  onRefresh?: () => void;
  emptyStateActions?: ToolbarActionConfig[];
  /** When true, the NoData variant shows a filter-hint message instead of the generic "create first" message */
  hasFilters?: boolean;
}

interface NoDataProps {
  onAdd?: () => void;
  onSecondary?: () => void;
  secondaryLabel?: string;
  entityName?: string;
  entityNamePlural?: string;
  description?: string;
  icon?: ReactNode;
  onRefresh?: () => void;
  emptyStateActions?: ToolbarActionConfig[];
  hasFilters?: boolean;
}

interface NoResultsProps {
  searchText?: string;
  activeChips?: string[];
  onClear?: () => void;
  entityNamePlural?: string;
}

interface FilteredProps {
  activeChips?: string[];
  onClear?: () => void;
  entityNamePlural?: string;
}

interface ErrorProps {
  errorMessage?: string;
  onRetry?: () => void;
  entityNamePlural?: string;
}

// ── Design tokens ─────────────────────────────────────────────────────────────

const T = {
  heading: '#111827',
  body: '#6B7280',
  helper: '#9CA3AF',
  surface: '#FFFFFF',
  surfaceAlt: '#F9FAFB',
  border: '#E5E7EB',
  blue: '#2176FF',
  blueHover: '#1A5FCC',
  blueSoft: '#EFF6FF',
  blueMid: '#DBEAFE',
  blueRing: 'rgba(33,118,255,0.08)',
  amber: '#D97706',
  amberSoft: '#FFFBEB',
  amberMid: '#FDE68A',
  amberRing: 'rgba(217,119,6,0.08)',
  violet: '#7C3AED',
  violetSoft: '#F5F3FF',
  violetMid: '#DDD6FE',
  violetRing: 'rgba(124,58,237,0.08)',
  red: '#DC2626',
  redSoft: '#FEF2F2',
  redMid: '#FECACA',
  redRing: 'rgba(220,38,38,0.08)',
};

// ── Animation injection ───────────────────────────────────────────────────────

const CSS = `
  @keyframes tps-es-in {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes tps-es-spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  .tps-es-root {
    animation: tps-es-in 0.28s cubic-bezier(.22,1,.36,1) both;
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    -webkit-font-smoothing: antialiased;
  }
`;

function injectStyles() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('tps-es-styles')) return;
  const el = document.createElement('style');
  el.id = 'tps-es-styles';
  el.textContent = CSS;
  document.head.appendChild(el);
}

// ── Concentric-ring icon ──────────────────────────────────────────────────────

interface IconRingProps {
  children: ReactNode;
  ring: string;       // outer halo colour
  from: string;       // inner gradient start
  to: string;         // inner gradient end
  border: string;     // inner border colour
  shadow: string;     // inner drop shadow
}

function IconRing({ children, ring, from, to, border, shadow }: IconRingProps) {
  return (
    <div style={{
      position: 'relative',
      width: 100, height: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      {/* Outer halo ring */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        background: ring,
      }} />
      {/* Mid ring */}
      <div style={{
        position: 'absolute',
        inset: 12, borderRadius: '50%',
        background: from,
        opacity: 0.5,
      }} />
      {/* Inner icon circle */}
      <div style={{
        position: 'relative',
        width: 64, height: 64, borderRadius: '50%',
        background: `linear-gradient(145deg, ${from}, ${to})`,
        border: `1.5px solid ${border}`,
        boxShadow: shadow,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1,
      }}>
        {children}
      </div>
    </div>
  );
}

// ── Buttons ───────────────────────────────────────────────────────────────────

function PrimaryBtn({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 7,
        padding: '9px 22px', borderRadius: 10, border: 'none',
        background: hov ? T.blueHover : T.blue,
        color: '#fff', fontSize: 13.5, fontWeight: 600,
        cursor: 'pointer', fontFamily: 'inherit',
        boxShadow: hov
          ? '0 6px 20px rgba(33,118,255,.40)'
          : '0 2px 12px rgba(33,118,255,.25)',
        transition: 'all .18s',
        letterSpacing: '-.1px',
      }}
    >
      {children}
    </button>
  );
}

function GhostBtn({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '9px 20px', borderRadius: 10,
        border: `1.5px solid ${hov ? '#C9D0D8' : T.border}`,
        background: hov ? T.surfaceAlt : T.surface,
        color: hov ? T.heading : T.body,
        fontSize: 13.5, fontWeight: 500,
        cursor: 'pointer', fontFamily: 'inherit',
        transition: 'all .18s', letterSpacing: '-.1px',
      }}
    >
      {children}
    </button>
  );
}

function DangerBtn({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 7,
        padding: '9px 22px', borderRadius: 10,
        border: `1.5px solid ${hov ? '#FCA5A5' : T.redMid}`,
        background: hov ? '#FEE2E2' : T.redSoft,
        color: T.red, fontSize: 13.5, fontWeight: 600,
        cursor: 'pointer', fontFamily: 'inherit',
        transition: 'all .18s', letterSpacing: '-.1px',
      }}
    >
      {children}
    </button>
  );
}

// ── Filter chip ───────────────────────────────────────────────────────────────

function Chip({ label }: { label: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: T.violetSoft, color: T.violet,
      border: `1px solid ${T.violetMid}`,
      borderRadius: 100, padding: '3px 10px',
      fontSize: 11.5, fontWeight: 500,
    }}>
      <Filter size={9} />
      {label}
    </span>
  );
}

// ── Root wrapper ──────────────────────────────────────────────────────────────

const rootStyle: CSSProperties = {
  padding: '72px 32px 64px',
  display: 'flex', flexDirection: 'column',
  alignItems: 'center', gap: 22,
  textAlign: 'center',
};

const textBlock: CSSProperties = {
  display: 'flex', flexDirection: 'column',
  alignItems: 'center', gap: 8,
  maxWidth: 340,
};

// ── 1. No Data ────────────────────────────────────────────────────────────────

export function TpsEmptyStateNoData({
  onAdd,
  onSecondary,
  secondaryLabel,
  entityName = 'Item',
  entityNamePlural = 'Items',
  description,
  icon,
  onRefresh,
  emptyStateActions,
  hasFilters = false,
}: NoDataProps) {
  injectStyles();

  const visibleActions = emptyStateActions?.filter((a) => a.show !== false && a.primary === true) ?? [];
  const hasActions = visibleActions.length > 0 || onAdd || onSecondary || onRefresh;

  return (
    <div className="tps-es-root" style={rootStyle}>
      <IconRing
        ring={T.blueRing}
        from={T.blueSoft}
        to={T.blueMid}
        border={T.blueMid}
        shadow="0 4px 16px rgba(33,118,255,0.18), inset 0 1px 0 rgba(255,255,255,0.8)"
      >
        {icon ?? <EmptyTableIcon color={T.blue} />}
      </IconRing>

      <div style={textBlock}>
        <h3 style={{
          margin: 0, fontSize: 17, fontWeight: 700,
          color: T.heading, letterSpacing: '-.35px', lineHeight: 1.3,
        }}>
          {hasFilters ? 'No data to display' : `No ${entityNamePlural} yet`}
        </h3>
        <p style={{
          margin: 0, fontSize: 13.5, color: T.body,
          lineHeight: 1.7, maxWidth: 300,
        }}>
          {description ?? (hasFilters
            ? 'Use the filters above to select a date range or criteria, then apply to load results.'
            : `Get started by creating your first ${entityName.toLowerCase()}. It'll appear here once added.`)}
        </p>
      </div>



      {hasActions && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
          {/* Refresh */}
          {onRefresh && (
            <GhostBtn onClick={onRefresh}>
              <RotateCcw size={13} strokeWidth={2.2} />
              Refresh
            </GhostBtn>
          )}



          {/* emptyStateActions — mirrors toolbar actions in the empty state */}
          {visibleActions.map((action) => {
            const Icon = action.icon;
            return action.primary ? (
              <PrimaryBtn key={action.label} onClick={action.command}>
                {Icon && <Icon size={14} strokeWidth={2} />}
                {action.label}
              </PrimaryBtn>
            ) : (
              <GhostBtn key={action.label} onClick={action.command}>
                {Icon && <Icon size={14} strokeWidth={2} />}
                {action.label}
              </GhostBtn>
            );
          })}

          {/* Legacy onAdd (when emptyStateActions not used) */}
          {visibleActions.length === 0 && onAdd && (
            <PrimaryBtn onClick={onAdd}>
              <Plus size={14} strokeWidth={2.5} />
              Create {entityName}
            </PrimaryBtn>
          )}
          {visibleActions.length === 0 && onSecondary && (
            <GhostBtn onClick={onSecondary}>
              {secondaryLabel ?? 'Learn more'}
              <ArrowRight size={13} />
            </GhostBtn>
          )}


        </div>
      )}
    </div>
  );
}

// ── 2. No Search Results ──────────────────────────────────────────────────────

export function TpsEmptyStateNoResults({
  searchText,
  activeChips = [],
  onClear,
  entityNamePlural = 'records',
}: NoResultsProps) {
  injectStyles();
  const query = searchText?.trim();

  return (
    <div className="tps-es-root" style={rootStyle}>
      <IconRing
        ring={T.amberRing}
        from={T.amberSoft}
        to={T.amberMid}
        border={T.amberMid}
        shadow="0 4px 16px rgba(217,119,6,0.18), inset 0 1px 0 rgba(255,255,255,0.8)"
      >
        <SearchX size={28} color={T.amber} strokeWidth={1.4} />
      </IconRing>

      <div style={textBlock}>
        <h3 style={{
          margin: 0, fontSize: 17, fontWeight: 700,
          color: T.heading, letterSpacing: '-.35px', lineHeight: 1.3,
        }}>
          {query ? <>No results for &ldquo;{query}&rdquo;</> : `No ${entityNamePlural} found`}
        </h3>
        <p style={{ margin: 0, fontSize: 13.5, color: T.body, lineHeight: 1.7, maxWidth: 300 }}>
          No {entityNamePlural.toLowerCase()} matched your search.
          Try different keywords or check for typos.
        </p>
      </div>

      {activeChips.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 380 }}>
          {activeChips.slice(0, 5).map(chip => <Chip key={chip} label={chip} />)}
          {activeChips.length > 5 && (
            <span style={{ fontSize: 11.5, color: T.helper, alignSelf: 'center' }}>
              +{activeChips.length - 5} more
            </span>
          )}
        </div>
      )}

      {onClear && (
        <GhostBtn onClick={onClear}>
          <X size={13} strokeWidth={2.2} />
          Clear search
        </GhostBtn>
      )}
    </div>
  );
}

// ── 3. Filtered — no matches ──────────────────────────────────────────────────

export function TpsEmptyStateFiltered({
  activeChips = [],
  onClear,
  entityNamePlural = 'records',
}: FilteredProps) {
  injectStyles();

  return (
    <div className="tps-es-root" style={rootStyle}>
      <IconRing
        ring={T.violetRing}
        from={T.violetSoft}
        to={T.violetMid}
        border={T.violetMid}
        shadow="0 4px 16px rgba(124,58,237,0.18), inset 0 1px 0 rgba(255,255,255,0.8)"
      >
        <SlidersHorizontal size={28} color={T.violet} strokeWidth={1.4} />
      </IconRing>

      <div style={textBlock}>
        <h3 style={{
          margin: 0, fontSize: 17, fontWeight: 700,
          color: T.heading, letterSpacing: '-.35px', lineHeight: 1.3,
        }}>
          No matches for current filters
        </h3>
        <p style={{ margin: 0, fontSize: 13.5, color: T.body, lineHeight: 1.7, maxWidth: 300 }}>
          Your active filters returned no {entityNamePlural.toLowerCase()}.
          Try removing some filters to broaden your results.
        </p>
      </div>

      {activeChips.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 400 }}>
          {activeChips.slice(0, 6).map(chip => <Chip key={chip} label={chip} />)}
          {activeChips.length > 6 && (
            <span style={{ fontSize: 11.5, color: T.helper, alignSelf: 'center' }}>
              +{activeChips.length - 6} more
            </span>
          )}
        </div>
      )}

      {onClear && (
        <GhostBtn onClick={onClear}>
          <X size={13} strokeWidth={2.2} />
          Clear all filters
        </GhostBtn>
      )}

      {activeChips.length > 0 && (
        <p style={{ margin: 0, fontSize: 12, color: T.helper }}>
          {activeChips.length} filter{activeChips.length > 1 ? 's' : ''} active
        </p>
      )}
    </div>
  );
}

// ── 4. Error ──────────────────────────────────────────────────────────────────

export function TpsEmptyStateError({
  errorMessage,
  onRetry,
  entityNamePlural = 'data',
}: ErrorProps) {
  injectStyles();
  const [retrying, setRetrying] = useState(false);

  const handleRetry = () => {
    if (!onRetry) return;
    setRetrying(true);
    onRetry();
    setTimeout(() => setRetrying(false), 2500);
  };

  return (
    <div className="tps-es-root" style={rootStyle}>
      <IconRing
        ring={T.redRing}
        from={T.redSoft}
        to={T.redMid}
        border={T.redMid}
        shadow="0 4px 16px rgba(220,38,38,0.18), inset 0 1px 0 rgba(255,255,255,0.8)"
      >
        <AlertCircle size={28} color={T.red} strokeWidth={1.4} />
      </IconRing>

      <div style={textBlock}>
        <h3 style={{
          margin: 0, fontSize: 17, fontWeight: 700,
          color: T.heading, letterSpacing: '-.35px', lineHeight: 1.3,
        }}>
          Unable to load {entityNamePlural}
        </h3>
        <p style={{ margin: 0, fontSize: 13.5, color: T.body, lineHeight: 1.7, maxWidth: 300 }}>
          Something went wrong while fetching your data. This is usually temporary —
          try again or refresh the page.
        </p>
        {errorMessage && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            background: T.redSoft, border: `1px solid ${T.redMid}`,
            borderRadius: 8, padding: '5px 12px', marginTop: 4,
          }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: T.red, flexShrink: 0 }} />
            <span style={{ fontSize: 11.5, color: T.red, fontFamily: 'ui-monospace, monospace' }}>
              {errorMessage.length > 72 ? errorMessage.slice(0, 72) + '…' : errorMessage}
            </span>
          </div>
        )}
      </div>

      {onRetry && (
        <DangerBtn onClick={handleRetry}>
          <RotateCcw
            size={13} strokeWidth={2.2}
            style={{ animation: retrying ? 'tps-es-spin 0.9s linear infinite' : 'none' }}
          />
          {retrying ? 'Retrying…' : 'Try Again'}
        </DangerBtn>
      )}
    </div>
  );
}

// ── Smart auto-picker ─────────────────────────────────────────────────────────

export function TpsEmptyState({
  isError = false,
  errorMessage,
  isFiltered = false,
  isSearching = false,
  searchText,
  activeChips = [],
  onClear,
  onRetry,
  onAdd,
  onSecondary,
  secondaryLabel,
  entityName = 'Item',
  entityNamePlural,
  description,
  icon,
  onRefresh,
  emptyStateActions,
  hasFilters = false,
}: TpsEmptyStateProps) {
  const plural = entityNamePlural ?? `${entityName}s`;

  if (isError) {
    return <TpsEmptyStateError errorMessage={errorMessage} onRetry={onRetry} entityNamePlural={plural} />;
  }
  if (isSearching || (searchText && searchText.trim())) {
    return <TpsEmptyStateNoResults searchText={searchText} activeChips={activeChips} onClear={onClear} entityNamePlural={plural} />;
  }
  if (isFiltered) {
    return <TpsEmptyStateFiltered activeChips={activeChips} onClear={onClear} entityNamePlural={plural} />;
  }
  return (
    <TpsEmptyStateNoData
      onAdd={onAdd}
      onSecondary={onSecondary}
      secondaryLabel={secondaryLabel}
      entityName={entityName}
      entityNamePlural={plural}
      description={description}
      icon={icon}
      onRefresh={onRefresh}
      emptyStateActions={emptyStateActions}
      hasFilters={hasFilters}
    />
  );
}

export default TpsEmptyState;
