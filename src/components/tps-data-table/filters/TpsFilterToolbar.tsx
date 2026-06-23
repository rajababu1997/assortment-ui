/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, CalendarDays, ChevronDown, Check, SlidersHorizontal, RefreshCw, Download } from 'lucide-react';
import { DatePicker } from '@/components/primitives/DatePicker/DatePicker';
import { toast } from '@/lib/toast';
import { TpsDataTableColumnToggle } from '../TpsDataTableColumnToggle';
import { DEFAULT_DATE_PRESETS } from '../types';
import type {
  FilterSlotConfig,
  FilterSlotChips,
  FilterSlotSingleSelect,
  FilterSlotMultiSelect,
  FilterSlotSearch,
  FilterSlotDateRange,
  FilterSlotTags,
  DatePreset,
  ColumnConfig,
  ChipOption,
} from '../types';
import styles from './TpsFilterToolbar.module.css';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface FilterToolbarProps<T = any> {
  /** Slot configs — only slots with show !== false are rendered */
  slots: FilterSlotConfig[];
  /** Current filter values — controlled by the parent (TpsDataTable) */
  values: Record<string, any>;
  /** Called on every slot value change with the full updated values map */
  onChange: (_values: Record<string, any>) => void;
  /** Clears all filter values back to defaults */
  onClearAll?: () => void;

  // 2026 Design: Split Layout Configuration
  /** Layout mode: 'single-row' (default) or 'split' (2026 design) */
  layout?: 'single-row' | 'split';
  /** Table data for chip count calculation (2026 design) */
  tableData?: T[];
  /** Staged filters (left side) — require Apply button (2026 design) */
  stagedSlots?: FilterSlotConfig[];
  /** Instant filters (right side) — apply immediately (2026 design) */
  instantSlots?: FilterSlotChips[];
  /** Show Apply button for staged filters (2026 design) */
  showApplyButton?: boolean;
  /** Apply button label — default: 'Apply Filters' */
  applyButtonLabel?: string;
  /** Called when Apply button is clicked */
  onApply?: () => void;
  /** Pulse animation on Apply button when filters change */
  hasUnappliedChanges?: boolean;

  // Right-side utility controls
  showColumnToggle?: boolean;
  columns?: ColumnConfig<T>[];
  hiddenFields?: Set<string>;
  onToggleColumn?: (_field: string) => void;
  onShowAllColumns?: () => void;

  showExport?: boolean;
  onExport?: () => void;

  showRefresh?: boolean;
  onRefresh?: () => void;

  hasFilters?: boolean;
  hasActiveFilters?: boolean;
  activeFiltersCount?: number;
  onOpenFilterDrawer?: () => void;
}

// ── Build initial values from slot defaults ────────────────────────────────────

export function buildFilterInitialValues(slots: FilterSlotConfig[]): Record<string, any> {
  const out: Record<string, any> = {};
  for (const slot of slots) {
    if (slot.show === false) continue;
    if (slot.type === 'dateRange') {
      const s = slot as FilterSlotDateRange;
      out[s.fromField] = s.defaultValue?.from ?? null;
      out[s.toField] = s.defaultValue?.to ?? null;
    } else if (slot.type === 'chips') {
      const s = slot as FilterSlotChips;
      out[slot.field] = s.defaultValue ?? (s.multi ? [] : null);
    } else if (slot.type === 'multiSelect' || slot.type === 'tags') {
      out[(slot as any).field] = (slot as any).defaultValue ?? [];
    } else {
      out[(slot as any).field] = (slot as any).defaultValue ?? null;
    }
  }
  return out;
}

// ── Check if any slot has an active (non-empty) value ─────────────────────────

function hasAnyActive(values: Record<string, any>): boolean {
  return Object.values(values).some((v) => {
    if (v == null) return false;
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === 'string') return v.trim().length > 0;
    return true;
  });
}

// ── Slot: Chips / Segmented pills ─────────────────────────────────────────────

function SlotChips({
  config,
  value,
  onChange,
}: {
  config: FilterSlotChips;
  value: any | any[];
  onChange: (_v: any) => void;
}) {
  const multi = config.multi ?? false;
  const selected = new Set<any>(multi ? (Array.isArray(value) ? value : []) : value != null ? [value] : []);
  const hasActive = selected.size > 0;

  const toggle = (v: any) => {
    if (multi) {
      const next = new Set(selected);
      if (next.has(v)) next.delete(v);
      else next.add(v);
      onChange([...next]);
    } else {
      onChange(selected.has(v) ? null : v);
    }
  };

  const clear = () => onChange(multi ? [] : null);

  return (
    <div className={[styles.chipsGroup, hasActive ? styles.chipsGroupActive : ''].join(' ')}>
      {config.options.map((opt) => {
        const isActive = selected.has(opt.value);
        return (
          <button
            key={String(opt.value)}
            type="button"
            className={[styles.chip, isActive ? (multi ? styles.chipMultiActive : styles.chipActive) : ''].join(' ')}
            onClick={() => toggle(opt.value)}
            aria-pressed={isActive}
          >
            {opt.label}
          </button>
        );
      })}

      {/* Inline clear — slides in when any chip is active */}
      {hasActive && (
        <button type="button" className={styles.chipClear} onClick={clear} aria-label="Clear filter" title="Clear">
          <X size={10} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}

// ── Slot: Single Select ───────────────────────────────────────────────────────

function SlotSingleSelect({
  config,
  value,
  onChange,
}: {
  config: FilterSlotSingleSelect;
  value: any;
  onChange: (_v: any) => void;
}) {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<React.CSSProperties>({});
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const isActive = value != null;
  const selectedLabel = config.options.find((o) => o.value === value)?.label;

  const openMenu = () => {
    const rect = btnRef.current?.getBoundingClientRect();
    if (rect) {
      setMenuPos({
        top: rect.bottom + 4,
        left: rect.left,
        minWidth: Math.max(rect.width, 160),
      });
    }
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node) && !btnRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const clearable = config.clearable ?? true;

  return (
    <div style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        ref={btnRef}
        type="button"
        className={[styles.selectBtn, isActive ? styles.selectBtnActive : ''].join(' ')}
        onClick={() => (open ? setOpen(false) : openMenu())}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className={styles.selectLabel}>{selectedLabel ?? config.placeholder ?? config.label ?? 'Select'}</span>
        {isActive && clearable ? (
          <span
            role="button"
            tabIndex={-1}
            className={styles.selectClear}
            onClick={(e) => {
              e.stopPropagation();
              onChange(null);
              setOpen(false);
            }}
            aria-label="Clear"
          >
            <X size={10} strokeWidth={2.5} />
          </span>
        ) : (
          <ChevronDown
            size={12}
            style={{
              flexShrink: 0,
              transition: 'transform 150ms',
              transform: open ? 'rotate(180deg)' : 'none',
            }}
          />
        )}
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            className={styles.dropMenu}
            style={{ position: 'fixed', zIndex: 9999, ...menuPos }}
            role="listbox"
          >
            {config.options.map((opt) => (
              <button
                key={String(opt.value)}
                type="button"
                role="option"
                aria-selected={value === opt.value}
                className={[styles.dropOption, value === opt.value ? styles.dropOptionActive : ''].join(' ')}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
              >
                <span className={[styles.dropCheck, value === opt.value ? styles.dropCheckOn : ''].join(' ')}>
                  {value === opt.value && <Check size={9} strokeWidth={3} color="white" />}
                </span>
                {opt.label}
              </button>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
}

// ── Slot: Multi Select ────────────────────────────────────────────────────────

function SlotMultiSelect({
  config,
  value,
  onChange,
}: {
  config: FilterSlotMultiSelect;
  value: any[];
  onChange: (_v: any[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<React.CSSProperties>({});
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const selected = new Set<any>(Array.isArray(value) ? value : []);
  const isActive = selected.size > 0;
  const maxVisible = config.maxVisible ?? 1;

  const openMenu = () => {
    const rect = btnRef.current?.getBoundingClientRect();
    if (rect) {
      setMenuPos({
        top: rect.bottom + 4,
        left: rect.left,
        minWidth: Math.max(rect.width, 180),
      });
    }
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node) && !btnRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const toggle = (v: any) => {
    const next = new Set(selected);
    if (next.has(v)) next.delete(v);
    else next.add(v);
    onChange([...next]);
  };

  const displayText = () => {
    if (!isActive) return config.placeholder ?? config.label ?? 'Select';
    const labels = [...selected].map((v) => config.options.find((o) => o.value === v)?.label ?? String(v));
    if (labels.length <= maxVisible) return labels.join(', ');
    return `${labels.slice(0, maxVisible).join(', ')} +${labels.length - maxVisible}`;
  };

  return (
    <div style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        ref={btnRef}
        type="button"
        className={[styles.selectBtn, isActive ? styles.selectBtnActive : ''].join(' ')}
        onClick={() => (open ? setOpen(false) : openMenu())}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className={styles.selectLabel}>{displayText()}</span>
        {isActive ? (
          <span
            role="button"
            tabIndex={-1}
            className={styles.selectClear}
            onClick={(e) => {
              e.stopPropagation();
              onChange([]);
              setOpen(false);
            }}
            aria-label="Clear"
          >
            <X size={10} strokeWidth={2.5} />
          </span>
        ) : (
          <ChevronDown
            size={12}
            style={{
              flexShrink: 0,
              transition: 'transform 150ms',
              transform: open ? 'rotate(180deg)' : 'none',
            }}
          />
        )}
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            className={styles.dropMenu}
            style={{ position: 'fixed', zIndex: 9999, ...menuPos }}
            role="listbox"
            aria-multiselectable
          >
            {config.options.map((opt) => {
              const checked = selected.has(opt.value);
              return (
                <button
                  key={String(opt.value)}
                  type="button"
                  role="option"
                  aria-selected={checked}
                  className={[styles.dropOption, checked ? styles.dropOptionActive : ''].join(' ')}
                  onClick={() => toggle(opt.value)}
                >
                  <span className={[styles.dropCheck, checked ? styles.dropCheckOn : ''].join(' ')}>
                    {checked && <Check size={9} strokeWidth={3} color="white" />}
                  </span>
                  {opt.label}
                </button>
              );
            })}
          </div>,
          document.body
        )}
    </div>
  );
}

// ── Slot: Search input ────────────────────────────────────────────────────────

function SlotSearch({
  config,
  value,
  onChange,
}: {
  config: FilterSlotSearch;
  value: string;
  onChange: (_v: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className={styles.searchWrap}>
      <Search size={13} className={styles.searchIcon} />
      <input
        ref={inputRef}
        type="text"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={config.placeholder ?? config.label ?? 'Search…'}
        className={styles.searchInput}
        aria-label={config.label ?? 'Search'}
      />
      {value && (
        <button
          type="button"
          className={styles.searchClear}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            onChange('');
            inputRef.current?.focus();
          }}
          aria-label="Clear search"
        >
          <X size={9} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}

// ── Slot: Date Range ──────────────────────────────────────────────────────────

function SlotDateRange({
  config,
  fromValue,
  toValue,
  onChange,
  onApply,
}: {
  config: FilterSlotDateRange;
  fromValue: Date | null;
  toValue: Date | null;
  onChange: (_from: Date | null, _to: Date | null) => void;
  onApply?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [popPos, setPopPos] = useState<React.CSSProperties>({});
  const [tempFrom, setTempFrom] = useState<Date | null>(fromValue);
  const [tempTo, setTempTo] = useState<Date | null>(toValue);
  const [activePreset, setActive] = useState<string | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const presets = config.presets ?? DEFAULT_DATE_PRESETS;
  const isActive = fromValue != null || toValue != null;

  const openPopover = () => {
    const rect = btnRef.current?.getBoundingClientRect();
    if (rect) {
      const left = Math.min(rect.left, window.innerWidth - 320);
      setPopPos({ top: rect.bottom + 6, left: Math.max(8, left) });
    }
    setTempFrom(fromValue);
    setTempTo(toValue);
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      const target = e.target as Element;
      const inPopover = popoverRef.current?.contains(target);
      const inTrigger = btnRef.current?.contains(target);
      const inDatePicker = !!target.closest?.('[data-datepicker-calendar]');
      if (!inPopover && !inTrigger && !inDatePicker) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const applyPreset = (preset: DatePreset) => {
    const { from, to } = preset.getRange();
    setTempFrom(from);
    setTempTo(to);
    setActive(preset.value);
    if (preset.value !== 'custom') {
      onChange(from, to);
      setOpen(false);
    }
  };

  const handleApply = () => {
    if (!tempFrom || !tempTo) {
      toast.error('Please select a date range');
      return;
    }
    if (tempFrom >= tempTo) {
      toast.error('From Date/Time should be less than To Date/Time');
      return;
    }
    onChange(tempFrom, tempTo);
    setOpen(false);
  };

  const handleClear = () => {
    setTempFrom(null);
    setTempTo(null);
    setActive(null);
    onChange(null, null);
    setOpen(false);
  };

  const fmtDate = (d: Date | null): string => {
    if (!d) return '';
    const date = d instanceof Date ? d : new Date(d);
    if (isNaN(date.getTime())) return '';
    const datePart = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    if (!config.showTime) return datePart;
    const h = date.getHours();
    const m = date.getMinutes();
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${datePart}, ${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
  };

  const displayLabel = (): string => {
    if (!isActive) return config.label ?? 'Date Range';
    const f = fmtDate(fromValue);
    const t = fmtDate(toValue);
    if (f && t) return `${f} – ${t}`;
    if (f) return `From ${f}`;
    if (t) return `Until ${t}`;
    return config.label ?? 'Date Range';
  };

  // ── Inline mode: render From/To pickers directly in the toolbar ─────────────
  if (config.inline) {
    const handleInlineApply = () => {
      if (!fromValue || !toValue) {
        toast.error('Please select a date range');
        return;
      }
      if (fromValue >= toValue) {
        toast.error('From Date/Time should be less than To Date/Time');
        return;
      }
      onApply?.();
    };

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 200 }}>
          <DatePicker
            value={fromValue}
            onChange={(v) => onChange(v ? new Date(v) : null, toValue)}
            showTime={config.showTime}
            placeholder={config.fromLabel ?? 'From Date'}
          />
        </div>
        <span style={{ fontSize: 13, color: 'var(--color-text-tertiary)', flexShrink: 0 }}>To</span>
        <div style={{ width: 200 }}>
          <DatePicker
            value={toValue}
            onChange={(v) => onChange(fromValue, v ? new Date(v) : null)}
            showTime={config.showTime}
            placeholder={config.toLabel ?? 'To Date'}
          />
        </div>
        {onApply && (
          <button type="button" className={styles.dateApplyBtn} onClick={handleInlineApply} style={{ marginLeft: 4 }}>
            Go
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className={[styles.dateBtn, isActive ? styles.dateBtnActive : ''].join(' ')}
        onClick={() => (open ? setOpen(false) : openPopover())}
        aria-expanded={open}
      >
        <CalendarDays size={13} style={{ flexShrink: 0 }} />
        <span className={styles.dateBtnLabel}>{displayLabel()}</span>
        {isActive ? (
          <span
            role="button"
            tabIndex={-1}
            className={styles.selectClear}
            onClick={(e) => {
              e.stopPropagation();
              handleClear();
            }}
            aria-label="Clear date range"
          >
            <X size={10} strokeWidth={2.5} />
          </span>
        ) : (
          <ChevronDown
            size={12}
            style={{
              flexShrink: 0,
              transition: 'transform 150ms',
              transform: open ? 'rotate(180deg)' : 'none',
            }}
          />
        )}
      </button>

      {open &&
        createPortal(
          <div ref={popoverRef} className={styles.datePopover} style={{ position: 'fixed', zIndex: 9999, ...popPos }}>
            {/* Quick preset chips */}
            <div className={styles.datePresets}>
              {presets.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  className={[styles.presetChip, activePreset === preset.value ? styles.presetChipActive : ''].join(
                    ' '
                  )}
                  onClick={() => applyPreset(preset)}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div className={styles.dateDivider} />

            {/* From / To date pickers */}
            <div className={styles.dateInputRow}>
              <div className={styles.dateInputGroup}>
                <span className={styles.dateInputLabel}>From</span>
                <DatePicker
                  value={tempFrom}
                  onChange={(v) => {
                    setTempFrom(v ? new Date(v) : null);
                    setActive('custom');
                  }}
                  showTime={config.showTime}
                  placeholder={config.fromLabel ?? 'From date'}
                />
              </div>
              <div className={styles.dateInputGroup}>
                <span className={styles.dateInputLabel}>To</span>
                <DatePicker
                  value={tempTo}
                  onChange={(v) => {
                    setTempTo(v ? new Date(v) : null);
                    setActive('custom');
                  }}
                  showTime={config.showTime}
                  placeholder={config.toLabel ?? 'To date'}
                />
              </div>
            </div>

            {/* Actions */}
            <div className={styles.dateActions}>
              <button type="button" className={styles.dateClearBtn} onClick={handleClear}>
                Clear
              </button>
              <button type="button" className={styles.dateApplyBtn} onClick={handleApply}>
                Apply
              </button>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

// ── Slot: Tags ────────────────────────────────────────────────────────────────

function SlotTags({
  config,
  value,
  onChange,
}: {
  config: FilterSlotTags;
  value: any[];
  onChange: (_v: any[]) => void;
}) {
  const selected = new Set<any>(Array.isArray(value) ? value : []);

  const toggle = (v: any) => {
    const next = new Set(selected);
    if (next.has(v)) next.delete(v);
    else next.add(v);
    onChange([...next]);
  };

  return (
    <div className={styles.tagsGroup}>
      {config.options.map((opt) => {
        const isActive = selected.has(opt.value);
        return (
          <button
            key={String(opt.value)}
            type="button"
            className={[styles.tag, isActive ? styles.tagActive : ''].join(' ')}
            onClick={() => toggle(opt.value)}
            aria-pressed={isActive}
          >
            {opt.label}
            {isActive && <X size={9} strokeWidth={2.5} style={{ marginLeft: 2 }} />}
          </button>
        );
      })}
    </div>
  );
}

// ── Slot key helper ───────────────────────────────────────────────────────────

function slotKey(slot: FilterSlotConfig): string {
  if (slot.type === 'dateRange') {
    return `dateRange-${slot.fromField}-${slot.toField}`;
  }
  return `${slot.type}-${slot.field}`;
}

// ── Modern Chip with Count Badge (2026 Design) ───────────────────────────────

function ModernChipWithCount({
  option,
  isActive,
  count,
  showCount,
  onClick,
}: {
  option: ChipOption;
  isActive: boolean;
  count?: number;
  showCount?: boolean;
  onClick: () => void;
}) {
  const colorStyle = option.color
    ? isActive
      ? { background: option.color.activeBg, color: option.color.activeText, borderColor: option.color.activeBorder }
      : { background: option.color.bg, color: option.color.text, borderColor: option.color.border ?? 'transparent' }
    : undefined;

  return (
    <button
      type="button"
      className={[styles.chipModern, !option.color && isActive ? styles.chipModernActive : ''].join(' ')}
      style={colorStyle}
      onClick={onClick}
      aria-pressed={isActive}
    >
      <span className={styles.chipLabel}>{option.label}</span>
      {showCount && count !== undefined && <span className={styles.chipCountBadge}>{count}</span>}
    </button>
  );
}

// ── Main TpsFilterToolbar ─────────────────────────────────────────────────────

export function TpsFilterToolbar<T = any>({
  slots,
  values,
  onChange,
  onClearAll,
  // 2026 split layout props
  layout = 'single-row',
  tableData,
  stagedSlots,
  instantSlots,
  showApplyButton,
  applyButtonLabel = 'Apply Filters',
  onApply,
  hasUnappliedChanges,
  // Utility controls
  showColumnToggle,
  columns = [],
  hiddenFields = new Set(),
  onToggleColumn,
  onShowAllColumns,
  showExport,
  onExport,
  showRefresh,
  onRefresh,
  hasFilters,
  hasActiveFilters,
  activeFiltersCount = 0,
  onOpenFilterDrawer,
}: FilterToolbarProps<T>) {
  const visibleSlots = useMemo(() => slots.filter((s) => s.show !== false), [slots]);

  const anyActive = hasAnyActive(values);

  const update = useCallback(
    (fieldOrFields: string | string[], val: any | any[]) => {
      const fields = Array.isArray(fieldOrFields) ? fieldOrFields : [fieldOrFields];
      const vals = Array.isArray(fieldOrFields) ? (val as any[]) : [val];
      const next = { ...values };
      fields.forEach((f, i) => {
        next[f] = vals[i];
      });
      onChange(next);
    },
    [values, onChange]
  );

  // 2026 Design: Calculate chip counts from table data
  const calculateChipCount = useCallback(
    (slot: FilterSlotChips, value: any): number => {
      if (!tableData || !slot.showCount) return 0;

      // Use custom count function if provided
      if (slot.getCount) {
        return slot.getCount(tableData, value);
      }

      // Default count: filter tableData by slot field
      return tableData.filter((row: any) => {
        const rowValue = row[slot.field];
        if (Array.isArray(rowValue)) {
          return rowValue.includes(value);
        }
        return rowValue === value;
      }).length;
    },
    [tableData]
  );

  // 2026 Design: Check if any instant chips are active
  const hasActiveChips = useMemo(() => {
    if (!instantSlots || layout !== 'split') return false;
    return instantSlots.some((slot) => {
      const val = values[slot.field];
      if (Array.isArray(val)) return val.length > 0;
      return val != null;
    });
  }, [instantSlots, values, layout]);

  // 2026 Design: Clear only instant chip filters
  const clearChips = useCallback(() => {
    if (!instantSlots) return;
    const next = { ...values };
    instantSlots.forEach((slot) => {
      next[slot.field] = slot.multi ? [] : null;
    });
    onChange(next);
  }, [instantSlots, values, onChange]);

  // 2026 Design: Keyboard shortcuts
  useEffect(() => {
    if (layout !== 'split') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K / Ctrl+K: Focus first filter
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        // Focus first staged slot input
        const firstInput = document.querySelector('[data-filter-slot]') as HTMLElement;
        firstInput?.focus();
      }

      // Cmd+Enter / Ctrl+Enter: Apply filters
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && showApplyButton && onApply) {
        e.preventDefault();
        onApply();
      }

      // Escape: Clear chips
      if (e.key === 'Escape' && hasActiveChips) {
        e.preventDefault();
        clearChips();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [layout, showApplyButton, onApply, hasActiveChips, clearChips]);

  const showUtility = showColumnToggle || showExport || showRefresh || hasFilters;

  // ══════════════════════════════════════════════════════════════════════════════
  // 2026 DESIGN: SPLIT LAYOUT
  // ══════════════════════════════════════════════════════════════════════════════

  if (layout === 'split') {
    const visibleStagedSlots = (stagedSlots ?? []).filter((s) => s.show !== false);
    const visibleInstantSlots = (instantSlots ?? []).filter((s) => s.show !== false);

    if (visibleStagedSlots.length === 0 && visibleInstantSlots.length === 0) return null;

    return (
      <div className={styles.toolbarSplit}>
        <span className={styles.filterLabel}>Filters</span>
        {/* ─── LEFT SECTION: Staged filters + Apply button ─────────────────── */}
        <div className={styles.leftSection}>
          {visibleStagedSlots.map((slot) => (
            <div key={slotKey(slot)} className={styles.slotWrap} data-filter-slot>
              {slot.type === 'singleSelect' && (
                <SlotSingleSelect
                  config={slot as FilterSlotSingleSelect}
                  value={values[(slot as FilterSlotSingleSelect).field]}
                  onChange={(v) => update((slot as FilterSlotSingleSelect).field, v)}
                />
              )}
              {slot.type === 'multiSelect' && (
                <SlotMultiSelect
                  config={slot as FilterSlotMultiSelect}
                  value={values[(slot as FilterSlotMultiSelect).field] ?? []}
                  onChange={(v) => update((slot as FilterSlotMultiSelect).field, v)}
                />
              )}
              {slot.type === 'dateRange' && (
                <SlotDateRange
                  config={slot as FilterSlotDateRange}
                  fromValue={values[(slot as FilterSlotDateRange).fromField] ?? null}
                  toValue={values[(slot as FilterSlotDateRange).toField] ?? null}
                  onChange={(from, to) =>
                    update([(slot as FilterSlotDateRange).fromField, (slot as FilterSlotDateRange).toField], [from, to])
                  }
                  onApply={(slot as FilterSlotDateRange).inline ? onApply : undefined}
                />
              )}
              {slot.type === 'search' && (
                <SlotSearch
                  config={slot as FilterSlotSearch}
                  value={values[(slot as FilterSlotSearch).field] ?? ''}
                  onChange={(v) => update((slot as FilterSlotSearch).field, v)}
                />
              )}
            </div>
          ))}

          {/* Apply button — hidden when inline dateRange already provides its own GO button */}
          {showApplyButton &&
            onApply &&
            !slots.some((s) => s.type === 'dateRange' && (s as FilterSlotDateRange).inline) && (
              <button
                type="button"
                className={[styles.applyBtn, hasUnappliedChanges ? styles.applyBtnPulse : ''].join(' ')}
                onClick={onApply}
                aria-label={applyButtonLabel}
                title={applyButtonLabel}
              >
                {applyButtonLabel}
              </button>
            )}
        </div>

        {/* ─── DIVIDER ────────────────────────────────────────────────────── */}
        {visibleInstantSlots.length > 0 && <div className={styles.splitDivider} />}

        {/* ─── RIGHT SECTION: Instant chip filters + Clear button ──────────── */}
        {visibleInstantSlots.length > 0 && (
          <div className={styles.rightSection}>
            <div className={styles.chipGrid}>
              {visibleInstantSlots.map((slot, slotIdx) => {
                const currentValue = values[slot.field];
                const selected = new Set<any>(
                  slot.multi
                    ? Array.isArray(currentValue)
                      ? currentValue
                      : []
                    : currentValue != null
                      ? [currentValue]
                      : []
                );

                const toggle = (v: any) => {
                  if (slot.multi) {
                    const next = new Set(selected);
                    if (next.has(v)) next.delete(v);
                    else next.add(v);
                    update(slot.field, [...next]);
                  } else {
                    update(slot.field, selected.has(v) ? null : v);
                  }
                };

                return (
                  <React.Fragment key={slotKey(slot)}>
                    {slotIdx > 0 && <div className={styles.chipGroupDivider} />}
                    <div className={styles.chipRow}>
                      {slot.label && <span className={styles.chipGroupLabel}>{slot.label}:</span>}
                      {slot.options.map((opt) => {
                        const isActive = selected.has(opt.value);
                        const count = slot.showCount ? calculateChipCount(slot, opt.value) : undefined;

                        return (
                          <ModernChipWithCount
                            key={String(opt.value)}
                            option={opt}
                            isActive={isActive}
                            count={count}
                            showCount={slot.showCount}
                            onClick={() => toggle(opt.value)}
                          />
                        );
                      })}
                    </div>
                  </React.Fragment>
                );
              })}
            </div>

            {/* Clear Filters button — only visible when chips active */}
            {hasActiveChips && (
              <button
                type="button"
                className={styles.clearFiltersModern}
                onClick={clearChips}
                aria-label="Clear chip filters"
                title="Clear all chip filters"
              >
                <X size={11} strokeWidth={2.5} />
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // DEFAULT: SINGLE-ROW LAYOUT
  // ══════════════════════════════════════════════════════════════════════════════

  if (visibleSlots.length === 0 && !showUtility) return null;

  return (
    <div className={styles.toolbar}>
      <span className={styles.filterLabel}>Filters</span>
      {/* Left: filter slots */}
      <div className={styles.filters}>
        {visibleSlots.map((slot) => (
          <div key={slotKey(slot)} className={styles.slotWrap}>
            {slot.type === 'chips' && (
              <SlotChips
                config={slot as FilterSlotChips}
                value={values[(slot as FilterSlotChips).field]}
                onChange={(v) => update((slot as FilterSlotChips).field, v)}
              />
            )}
            {slot.type === 'singleSelect' && (
              <SlotSingleSelect
                config={slot as FilterSlotSingleSelect}
                value={values[(slot as FilterSlotSingleSelect).field]}
                onChange={(v) => update((slot as FilterSlotSingleSelect).field, v)}
              />
            )}
            {slot.type === 'multiSelect' && (
              <SlotMultiSelect
                config={slot as FilterSlotMultiSelect}
                value={values[(slot as FilterSlotMultiSelect).field] ?? []}
                onChange={(v) => update((slot as FilterSlotMultiSelect).field, v)}
              />
            )}
            {slot.type === 'search' && (
              <SlotSearch
                config={slot as FilterSlotSearch}
                value={values[(slot as FilterSlotSearch).field] ?? ''}
                onChange={(v) => update((slot as FilterSlotSearch).field, v)}
              />
            )}
            {slot.type === 'dateRange' && (
              <SlotDateRange
                config={slot as FilterSlotDateRange}
                fromValue={values[(slot as FilterSlotDateRange).fromField] ?? null}
                toValue={values[(slot as FilterSlotDateRange).toField] ?? null}
                onChange={(from, to) =>
                  update([(slot as FilterSlotDateRange).fromField, (slot as FilterSlotDateRange).toField], [from, to])
                }
                onApply={(slot as FilterSlotDateRange).inline ? onApply : undefined}
              />
            )}
            {slot.type === 'tags' && (
              <SlotTags
                config={slot as FilterSlotTags}
                value={values[(slot as FilterSlotTags).field] ?? []}
                onChange={(v) => update((slot as FilterSlotTags).field, v)}
              />
            )}
          </div>
        ))}

        {/* Clear all — hidden in GO mode (showApplyButton); clearing without re-clicking GO is confusing */}
        {anyActive && onClearAll && !showApplyButton && (
          <>
            <span className={styles.sep} />
            <button type="button" className={styles.clearBtn} onClick={onClearAll}>
              <X size={11} strokeWidth={2.5} />
              Clear
            </button>
          </>
        )}

        {/* GO / Apply button — single-row layout */}
        {showApplyButton &&
          onApply &&
          !slots.some((s) => s.type === 'dateRange' && (s as FilterSlotDateRange).inline) && (
            <button
              type="button"
              className={[styles.applyBtn, hasUnappliedChanges ? styles.applyBtnPulse : ''].join(' ')}
              onClick={onApply}
              aria-label={applyButtonLabel}
              title={applyButtonLabel}
            >
              {applyButtonLabel}
            </button>
          )}
      </div>

      {/* Right: utility controls */}
      {showUtility && (
        <>
          <span className={styles.utilSep} />
          <div className={styles.utilities}>
            {/* Advanced filter drawer */}
            {hasFilters && (
              <button
                type="button"
                className={[styles.utilBtn, hasActiveFilters ? styles.utilBtnActive : ''].join(' ')}
                onClick={onOpenFilterDrawer}
                title={
                  hasActiveFilters
                    ? `${activeFiltersCount} filter${activeFiltersCount !== 1 ? 's' : ''} active`
                    : 'Advanced Filters'
                }
                aria-label="Advanced Filters"
              >
                <SlidersHorizontal size={14} />
                {activeFiltersCount > 0 && <span className={styles.utilBadge}>{activeFiltersCount}</span>}
              </button>
            )}

            {/* Column visibility toggle */}
            {showColumnToggle && onToggleColumn && (
              <TpsDataTableColumnToggle
                columns={columns}
                hiddenFields={hiddenFields}
                onToggle={onToggleColumn}
                onShowAll={onShowAllColumns ?? (() => {})}
              />
            )}

            {/* CSV export */}
            {showExport && onExport && (
              <button
                type="button"
                className={styles.utilBtn}
                onClick={onExport}
                title="Export CSV"
                aria-label="Export CSV"
              >
                <Download size={14} />
              </button>
            )}

            {/* Refresh */}
            {showRefresh && onRefresh && (
              <button type="button" className={styles.utilBtn} onClick={onRefresh} title="Refresh" aria-label="Refresh">
                <RefreshCw size={14} />
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
