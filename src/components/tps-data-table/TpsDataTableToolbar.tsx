import { useState, useRef, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Search,
  X,
  SlidersHorizontal,
  Download,
  RefreshCw,
  ArrowLeft,
  MoreHorizontal,
  Info,
  Settings,
  FileSpreadsheet,
} from 'lucide-react';
import { LUCIDE_ICON } from '@/constants/lucideIcons';
import { TpsDataTableColumnToggle } from './TpsDataTableColumnToggle';
import { TpsDataTableHeaderActionsSheet } from './TpsDataTableHeaderActionsSheet';
import { useTpsIsMobile } from './hooks/useTpsResponsiveColumns';
import type { ColumnConfig, ToolbarActionConfig } from './types';
import styles from './TpsDataTableToolbar.module.css';

// ── Icon resolver ─────────────────────────────────────────────────────────────

/**
 * Resolves icon to a React node - supports both Lucide components and string names
 */
function resolveIcon(icon?: LucideIcon | string, size = 14): ReactNode | null {
  if (!icon) return null;

  // If it's a string, resolve it from LUCIDE_ICON map
  if (typeof icon === 'string') {
    const iconKey = icon.toUpperCase().replace(/-/g, '_');
    const IconComponent = LUCIDE_ICON[iconKey as keyof typeof LUCIDE_ICON];
    if (!IconComponent) return null;
    return <IconComponent size={size} strokeWidth={2} />;
  }

  // Otherwise treat as Lucide component
  const IconComponent = icon;
  return <IconComponent size={size} strokeWidth={2} />;
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface ToolbarProps<T> {
  header?: string;
  headerSubtitle?: string;
  headerDescription?: string;
  headerIcon?: LucideIcon | string;
  headerTooltip?: string;
  showTableHeader?: boolean;
  showBackIcon?: boolean;
  onBack?: () => void;

  totalRows: number;
  filteredRows: number;
  showRowCount?: boolean;

  showSearch?: boolean;
  searchText: string;
  onSearchChange: (_text: string) => void;

  showRefresh?: boolean;
  onRefresh?: () => void;
  showExport?: boolean;
  onExport?: () => void;

  enableColumnFilters?: boolean;
  showFloatingFilters?: boolean;
  onToggleFloatingFilters?: () => void;

  hasFilters?: boolean;
  hasActiveFilters?: boolean;
  activeFiltersCount?: number;
  onOpenFilterDrawer?: () => void;

  showColumnToggle?: boolean;
  columns: ColumnConfig<T>[];
  hiddenFields: Set<string>;
  onToggleColumn: (_field: string) => void;
  onShowAllColumns: () => void;

  headerActions?: ToolbarActionConfig[];
  toolbarActions?: ToolbarActionConfig[];

  tableKey?: string;

  /** When true, utility controls (export, refresh, column toggle, filter drawer)
   *  are hidden from Row 1 — they appear in Row 2 (TpsFilterToolbar) instead. */
  deferUtilityToRow2?: boolean;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function TpsDataTableToolbar<T>({
  header,
  headerSubtitle,
  headerDescription,
  headerIcon,
  headerTooltip,
  showTableHeader = true,
  showBackIcon = false,
  onBack,
  totalRows,
  filteredRows,
  showRowCount = true,
  showSearch = true,
  searchText,
  onSearchChange,
  showRefresh = true,
  onRefresh,
  showExport = true,
  onExport,
  enableColumnFilters = false,
  showFloatingFilters = false,
  onToggleFloatingFilters,
  hasFilters = false,
  hasActiveFilters = false,
  activeFiltersCount = 0,
  onOpenFilterDrawer,
  showColumnToggle = true,
  columns,
  hiddenFields,
  onToggleColumn,
  onShowAllColumns,
  headerActions = [],
  toolbarActions = [],
  tableKey: _tableKey,
  deferUtilityToRow2 = false,
}: ToolbarProps<T>) {
  const isMobile = useTpsIsMobile();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [headerActionsSheetOpen, setHeaderActionsSheetOpen] = useState(false);

  const handleSearchBlur = () => {
    if (!searchText.trim()) setSearchExpanded(false);
  };

  const visibleHeaderActions = headerActions.filter((a) => a.show !== false);
  const primaryActions = visibleHeaderActions.filter((a) => a.primary);
  const secondaryActions = visibleHeaderActions.filter((a) => a.secondary);
  const iconActions = toolbarActions.filter((a) => a.show !== false && !a.primary && !a.secondary);

  const subtitle = headerSubtitle ?? headerDescription;
  const isFiltered = filteredRows < totalRows && (searchText.trim() || hasActiveFilters);
  const showHeader = showTableHeader && !!(header || visibleHeaderActions.length > 0 || showBackIcon);

  // Utility controls are hidden when Row 2 (TpsFilterToolbar) is handling them
  const showUtility = !deferUtilityToRow2;

  const hasControls =
    showSearch ||
    (showUtility && (showRefresh || showExport || showColumnToggle || enableColumnFilters || hasFilters)) ||
    iconActions.length > 0 ||
    primaryActions.length > 0 ||
    secondaryActions.length > 0;

  if (!showHeader && !hasControls) return null;

  return (
    <div className={styles.root}>
      {/* ── Row 1: Title + controls ───────────────────────────────────────── */}
      <div className={styles.controlsRow}>
        {/* Left: title */}
        {showHeader && (
          <div className={styles.titleArea}>
            {showBackIcon && (
              <button type="button" className={styles.backBtn} onClick={onBack} aria-label="Go back">
                <ArrowLeft size={14} />
              </button>
            )}
            {headerIcon && (
              <div className={styles.iconPill}>{resolveIcon(headerIcon, 18) ?? <FileSpreadsheet size={18} />}</div>
            )}
            <div className={styles.titleStack}>
              <div className={styles.titleLine}>
                <span className={styles.titleText}>
                  {header}
                  {showRowCount && totalRows > 0 && (
                    <span className={isFiltered ? styles.titleCountFiltered : styles.titleCount}>
                      {' '}
                      ({isFiltered ? `${filteredRows}/${totalRows}` : totalRows})
                    </span>
                  )}
                </span>
                {headerTooltip && (
                  <span title={headerTooltip} className={styles.titleTooltip}>
                    <Info size={12} />
                  </span>
                )}
              </div>
              {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
            </div>
          </div>
        )}

        {/* Right: controls */}
        <div className={styles.controlsGroup}>
          {/* Global search */}
          {showSearch && (
            <div
              className={[styles.searchWrap, searchExpanded ? styles.searchWrapFocused : ''].join(' ')}
              onClick={() => {
                if (!searchExpanded) {
                  setSearchExpanded(true);
                  searchInputRef.current?.focus();
                }
              }}
            >
              <Search size={13} className={styles.searchIcon} />
              <input
                ref={searchInputRef}
                type="text"
                value={searchText}
                onChange={(e) => onSearchChange(e.target.value)}
                onFocus={() => setSearchExpanded(true)}
                onBlur={handleSearchBlur}
                placeholder={header ? `Search ${header.toLowerCase()}…` : 'Search…'}
                className={styles.searchInput}
                aria-label="Search table"
              />
              {searchText && (
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onSearchChange('');
                    searchInputRef.current?.focus();
                  }}
                  className={styles.searchClear}
                  aria-label="Clear search"
                >
                  <X size={9} strokeWidth={2.5} />
                </button>
              )}
            </div>
          )}

          {/* Divider: search → icon buttons */}
          {showSearch && (showUtility || iconActions.length > 0) && <span className={styles.divider} aria-hidden />}

          {/* Icon buttons group - wrapped with 8px gap */}
          {(showUtility || iconActions.length > 0) && (
            <div className={styles.iconBtnGroup}>
              {/* Custom icon toolbar actions */}
              {iconActions.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  className={styles.iconBtn}
                  onClick={action.command}
                  aria-label={action.label}
                  title={action.label}
                >
                  {resolveIcon(action.icon, 15) ?? <Settings size={15} />}
                </button>
              ))}

              {showUtility && (
                <>
                  {/* Floating column filter toggle */}
                  {enableColumnFilters && (
                    <button
                      type="button"
                      className={[styles.iconBtn, showFloatingFilters ? styles.iconBtnOn : ''].join(' ')}
                      onClick={onToggleFloatingFilters}
                      aria-label={showFloatingFilters ? 'Hide column filters' : 'Show column filters'}
                      title={showFloatingFilters ? 'Hide column filters' : 'Show column filters'}
                    >
                      <SlidersHorizontal size={15} />
                    </button>
                  )}

                  {/* Advanced filter drawer trigger */}
                  {hasFilters && (
                    <button
                      type="button"
                      className={[styles.iconBtn, hasActiveFilters ? styles.iconBtnOn : ''].join(' ')}
                      onClick={onOpenFilterDrawer}
                      aria-label={hasActiveFilters ? `${activeFiltersCount} filters active` : 'Advanced Filters'}
                      title={hasActiveFilters ? `${activeFiltersCount} filters active` : 'Advanced Filters'}
                    >
                      <SlidersHorizontal size={15} />
                      {activeFiltersCount > 0 && <span className={styles.btnBadge}>{activeFiltersCount}</span>}
                    </button>
                  )}

                  {/* Column visibility toggle */}
                  {showColumnToggle && (
                    <TpsDataTableColumnToggle
                      columns={columns}
                      hiddenFields={hiddenFields}
                      onToggle={onToggleColumn}
                      onShowAll={onShowAllColumns}
                    />
                  )}

                  {/* CSV export */}
                  {showExport && onExport && filteredRows > 0 && (
                    <button
                      type="button"
                      className={styles.iconBtn}
                      onClick={onExport}
                      aria-label="Export CSV"
                      title="Export CSV"
                    >
                      <Download size={15} />
                    </button>
                  )}

                  {/* Refresh */}
                  {showRefresh && onRefresh && (
                    <button
                      type="button"
                      className={styles.iconBtn}
                      onClick={onRefresh}
                      aria-label="Refresh"
                      title="Refresh"
                    >
                      <RefreshCw size={15} />
                    </button>
                  )}
                </>
              )}
            </div>
          )}

          {/* Divider: icons → CTA buttons */}
          {(secondaryActions.length > 0 || primaryActions.length > 0) && (
            <span className={styles.divider} aria-hidden />
          )}

          {/* CTA buttons group - wrapped with 8px gap */}
          {!isMobile && (secondaryActions.length > 0 || primaryActions.length > 0) && (
            <div className={styles.ctaBtnGroup}>
              {/* Secondary CTA buttons (desktop only) */}
              {secondaryActions.map((action) => (
                <button key={action.label} type="button" className={styles.secondaryBtn} onClick={action.command}>
                  {resolveIcon(action.icon, 14)}
                  {action.label}
                </button>
              ))}

              {/* Primary CTA buttons (desktop only) */}
              {primaryActions.map((action) => (
                <button key={action.label} type="button" className={styles.primaryBtn} onClick={action.command}>
                  {resolveIcon(action.icon, 14)}
                  {action.label}
                </button>
              ))}
            </div>
          )}

          {/* Mobile: sheet for all header actions */}
          {isMobile && visibleHeaderActions.length > 0 && (
            <button
              type="button"
              className={styles.iconBtn}
              onClick={() => setHeaderActionsSheetOpen(true)}
              aria-label="Table actions"
            >
              <MoreHorizontal size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Mobile header actions sheet */}
      <TpsDataTableHeaderActionsSheet
        open={headerActionsSheetOpen}
        onClose={() => setHeaderActionsSheetOpen(false)}
        title={header}
        actions={visibleHeaderActions}
      />
    </div>
  );
}
