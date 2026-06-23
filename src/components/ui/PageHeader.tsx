/**
 * PageHeader — Unified page header component.
 *
 * Matches the DataTable toolbar header style exactly so all pages
 * (list + detail) share the same visual language.
 *
 * Feature flags (all optional):
 *   - onBack      → back arrow button (detail pages)
 *   - icon        → gradient icon pill (standalone list pages)
 *   - statusBadge → rendered inline after title
 *   - count       → row count badge (blue pill)
 *   - actions     → right-side content
 *   - subtitle    → secondary text below title
 *   - description → longer description below title row
 *   - entityType  → small badge chip showing entity type
 */

import { isValidElement, type ReactNode, type MouseEvent } from 'react';
import { ChevronLeft, type LucideIcon } from 'lucide-react';
import { Tooltip } from '@/components/primitives/Tooltip/Tooltip';

// ── Reusable icon button matching the page header action style ────────────────

interface IconButtonProps {
  icon: ReactNode;
  onClick?: () => void;
  title?: string;
  className?: string;
}

export function HeaderIconButton({ icon, onClick, title, className = '' }: IconButtonProps) {
  const hover = (e: MouseEvent<HTMLButtonElement>, enter: boolean) => {
    const el = e.currentTarget;
    el.style.background = enter ? '#F8FAFC' : '#FFFFFF';
    el.style.borderColor = enter ? '#CBD5E1' : '#E2E8F0';
  };

  const btn = (
    <button
      onClick={onClick}
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 36,
        height: 36,
        borderRadius: 8,
        border: '1px solid #E2E8F0',
        background: '#FFFFFF',
        cursor: 'pointer',
        transition: 'background .15s, border-color .15s',
        flexShrink: 0,
      }}
      onMouseEnter={(e) => hover(e, true)}
      onMouseLeave={(e) => hover(e, false)}
    >
      {icon}
    </button>
  );

  if (!title) return btn;

  return (
    <Tooltip content={title} placement="bottom" portal>
      {btn}
    </Tooltip>
  );
}

interface PageHeaderProps {
  /** Page title */
  title: string;
  /** Optional subtitle (inline, after title) */
  subtitle?: string;
  /** Optional description line below title */
  description?: string;
  /** Icon - can be LucideIcon component or already-rendered JSX. Gradient icon pill. Ignored if onBack set. */
  icon?: LucideIcon | ReactNode;
  /** Optional custom background for icon pill */
  iconBg?: string;
  /** Back button handler — detail-page mode */
  onBack?: () => void;
  /** Tooltip for back button */
  backTooltip?: string;
  /** Status badge (inline after title) */
  statusBadge?: ReactNode;
  /** Count badge (blue pill, matches DataTable toolbar) */
  count?: number;
  /** Center content (rendered between title and actions) */
  centerContent?: ReactNode;
  /** Right-side content */
  actions?: ReactNode;
  /** Entity type badge (e.g. "Camera", "Facility") */
  entityType?: string;
}

export function PageHeader({
  title,
  subtitle,
  description,
  icon,
  iconBg,
  onBack,
  backTooltip = 'Go back',
  statusBadge,
  count,
  centerContent,
  actions,
  entityType,
}: PageHeaderProps) {
  return (
    <div className="flex shrink-0 flex-col" style={{ padding: '1rem 0' }}>
      <div className="flex flex-row items-center" style={{ boxSizing: 'border-box', gap: 16 }}>
        <div className="flex min-w-0 shrink-0 flex-row items-center" style={{ gap: '4px', height: '28px' }}>
          {/* Back button — 24×24 chevron only, no container border */}
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex shrink-0 cursor-pointer items-center justify-center border-0 bg-transparent p-0 transition-opacity hover:opacity-70 active:opacity-50"
              style={{ width: '24px', height: '24px' }}
              title={backTooltip}
              aria-label={backTooltip}
            >
              <ChevronLeft size={24} strokeWidth={1.5} color="#8190A5" />
            </button>
          )}

          {/* Icon pill — matches TPS table toolbar .iconPill exactly */}
          {!onBack && icon && (
            <div
              className="shrink-0"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 36,
                height: 36,
                borderRadius: 'var(--radius-lg)',
                background: iconBg ?? 'var(--color-primary)',
                color: 'var(--color-primary-contrast)',
              }}
            >
              {isValidElement(icon)
                ? icon
                : (() => {
                    const IconComponent = icon as LucideIcon;
                    return <IconComponent size={18} strokeWidth={2} />;
                  })()}
            </div>
          )}

          {/* Title + badges area (column layout) */}
          <div className="flex min-w-0 flex-col" style={{ gap: '2px' }}>
            {/* Title row with badges */}
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <div
                className="truncate"
                style={{
                  margin: 0,
                  fontFamily: "'Inter', system-ui, sans-serif",
                  fontWeight: 600,
                  fontSize: '18px',
                  letterSpacing: '0%',
                  color: '#29313C',
                }}
              >
                {title}
              </div>

              {/* Entity type badge */}
              {entityType && (
                <span className="inline-flex shrink-0 items-center rounded-full bg-[var(--color-primary-100)] px-2 py-0.5 text-[0.625rem] font-semibold uppercase tracking-wider text-[var(--color-primary-700)]">
                  {entityType}
                </span>
              )}

              {/* Count badge */}
              {count !== undefined && count > 0 && (
                <span
                  className="inline-flex shrink-0 items-center justify-center rounded-full bg-[var(--color-info-50)] px-2 py-0.5 text-xs font-semibold tabular-nums text-[var(--color-info-700)]"
                  style={{ minWidth: '26px' }}
                >
                  {count}
                </span>
              )}

              {/* Status badge (detail pages) */}
              {statusBadge}
            </div>

            {/* Subtitle (below title) */}
            {subtitle && (
              <p className="truncate text-xs text-[var(--color-text-tertiary)]" style={{ margin: 0 }}>
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Center content */}
        {centerContent && <div className="flex flex-1 items-center justify-center">{centerContent}</div>}

        {/* Right actions */}
        {actions && (
          <div
            className={`flex shrink-0 flex-row items-center justify-end ${!centerContent ? 'flex-1' : ''}`}
            style={{ gap: '24px' }}
          >
            {actions}
          </div>
        )}
      </div>

      {/* Description line */}
      {description && (
        <p className="-mt-1 px-3 pb-2 text-xs leading-relaxed text-[var(--color-text-tertiary)]">{description}</p>
      )}
    </div>
  );
}
