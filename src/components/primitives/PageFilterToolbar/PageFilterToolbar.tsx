import { X, Search, CalendarDays, ChevronDown } from 'lucide-react';
import { DatePicker } from '../DatePicker';
import { Select } from '../Select';
import { Input } from '../Input';
import { Button } from '../Button';
import { useState, useRef, useEffect, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { toast } from '@/lib/toast';
import styles from './PageFilterToolbar.module.css';

// ── Types ────────────────────────────────────────────────────────────────────

export interface FilterOption {
  value: string;
  label: string;
}

export interface DateRangeFilter {
  type: 'dateRange';
  fromField: string;
  toField: string;
  fromPlaceholder?: string;
  toPlaceholder?: string;
  maxDate?: string;
  showTime?: boolean;
  inline?: boolean;
  label?: string;
}

export interface TimeRangeFilter {
  type: 'timeRange';
  fromField: string;
  toField: string;
}

export interface DropdownFilter {
  type: 'dropdown';
  field: string;
  placeholder?: string;
  options: FilterOption[];
  clearable?: boolean;
}

export interface InputFilter {
  type: 'input';
  field: string;
  placeholder?: string;
  inputType?: 'text' | 'number' | 'email';
}

export interface ChipsFilter {
  type: 'chips';
  field: string;
  options: readonly FilterOption[];
  multi?: boolean;
}

export type FilterConfig = DateRangeFilter | TimeRangeFilter | DropdownFilter | InputFilter | ChipsFilter;

export interface PageFilterToolbarProps {
  /** Left-side filters (date range, dropdowns, inputs) */
  leftFilters: FilterConfig[];
  /** Right-side chip filters (optional) */
  rightFilters?: ChipsFilter[];
  /** Current filter values */
  values: Record<string, unknown>;
  /** Called when any filter changes */
  onChange: (_: Record<string, unknown>) => void;
  /** Called when Apply is clicked */
  onApply?: () => void;
  /** Show/hide Clear Filters button */
  showClearButton?: boolean;
  /** Called when Clear Filters is clicked */
  onClear?: () => void;
  /** Custom Apply button label */
  applyLabel?: string;
  /** Icon for Apply button — pass null to hide */
  applyIcon?: ReactNode | null;
}

type DatePickerValue = string | Date | null;

const toDatePickerValue = (value: unknown): DatePickerValue => {
  if (value instanceof Date || typeof value === 'string') return value;
  return null;
};

const toDateValue = (value: unknown): Date | null => {
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') return value ? new Date(value) : null;
  return null;
};

const toInputValue = (value: unknown): string => {
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  return '';
};

const toSelectValue = (value: unknown): string | number | null => {
  if (typeof value === 'string' || typeof value === 'number') return value;
  return null;
};

// ── Date presets (same as TpsFilterToolbar DEFAULT_DATE_PRESETS) ──────────────

interface DatePreset {
  label: string;
  value: string;
  getRange: () => { from: Date; to: Date };
}

const DATE_PRESETS: DatePreset[] = [
  {
    label: 'Today',
    value: 'today',
    getRange: () => {
      const now = new Date();
      const s = new Date(now);
      s.setHours(0, 0, 0, 0);
      return { from: s, to: now };
    },
  },
  {
    label: 'Yesterday',
    value: 'yesterday',
    getRange: () => {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      y.setHours(0, 0, 0, 0);
      const e = new Date(y);
      e.setHours(23, 59, 59, 999);
      return { from: y, to: e };
    },
  },
  {
    label: '7 Days',
    value: '7d',
    getRange: () => {
      const now = new Date();
      const s = new Date(now);
      s.setDate(s.getDate() - 7);
      s.setHours(0, 0, 0, 0);
      return { from: s, to: now };
    },
  },
  {
    label: '30 Days',
    value: '30d',
    getRange: () => {
      const now = new Date();
      const s = new Date(now);
      s.setDate(s.getDate() - 30);
      s.setHours(0, 0, 0, 0);
      return { from: s, to: now };
    },
  },
  { label: 'Custom', value: 'custom', getRange: () => ({ from: new Date(), to: new Date() }) },
];

// ── Date Range Picker Popover (exact copy of SlotDateRange from TpsFilterToolbar) ──

interface DateRangePickerPopoverProps {
  filter: DateRangeFilter;
  fromValue: Date | null;
  toValue: Date | null;
  onChange: (_from: Date | null, _to: Date | null) => void;
}

function DateRangePickerPopover({ filter, fromValue, toValue, onChange }: DateRangePickerPopoverProps) {
  const [open, setOpen] = useState(false);
  const [popPos, setPopPos] = useState<CSSProperties>({});
  const [tempFrom, setTempFrom] = useState<Date | null>(fromValue);
  const [tempTo, setTempTo] = useState<Date | null>(toValue);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

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
    setActivePreset(preset.value);
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
    setActivePreset(null);
    onChange(null, null);
    setOpen(false);
  };

  const fmtDate = (d: Date | null): string => {
    if (!d) return '';
    const date = d instanceof Date ? d : new Date(d);
    if (isNaN(date.getTime())) return '';
    const datePart = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    if (!filter.showTime) return datePart;
    const h = date.getHours();
    const m = date.getMinutes();
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${datePart}, ${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
  };

  const displayLabel = (): string => {
    if (!isActive) return filter.label ?? 'Date Range';
    const f = fmtDate(fromValue);
    const t = fmtDate(toValue);
    if (f && t) return `${f} – ${t}`;
    if (f) return `From ${f}`;
    if (t) return `Until ${t}`;
    return filter.label ?? 'Date Range';
  };

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
            style={{ flexShrink: 0, transition: 'transform 150ms', transform: open ? 'rotate(180deg)' : 'none' }}
          />
        )}
      </button>

      {open &&
        createPortal(
          <div ref={popoverRef} className={styles.datePopover} style={{ position: 'fixed', zIndex: 9999, ...popPos }}>
            <div className={styles.datePresets}>
              {DATE_PRESETS.map((preset) => (
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

            <div className={styles.dateInputRow}>
              <div className={styles.dateInputGroup}>
                <span className={styles.dateInputLabel}>From</span>
                <DatePicker
                  value={tempFrom}
                  onChange={(v) => {
                    setTempFrom(v ? new Date(v) : null);
                    setActivePreset('custom');
                  }}
                  showTime={filter.showTime}
                  placeholder={filter.fromPlaceholder ?? 'From date'}
                />
              </div>
              <div className={styles.dateInputGroup}>
                <span className={styles.dateInputLabel}>To</span>
                <DatePicker
                  value={tempTo}
                  onChange={(v) => {
                    setTempTo(v ? new Date(v) : null);
                    setActivePreset('custom');
                  }}
                  showTime={filter.showTime}
                  placeholder={filter.toPlaceholder ?? 'To date'}
                />
              </div>
            </div>

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

// ── Filter Chip Component ────────────────────────────────────────────────────

interface ChipProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

function FilterChip({ label, active, onClick }: ChipProps) {
  return (
    <button
      onClick={onClick}
      className="transition-all duration-200 hover:scale-105"
      style={{
        padding: '6px 16px',
        borderRadius: 24,
        fontSize: 13,
        fontWeight: active ? 600 : 500,
        fontFamily: 'Inter, sans-serif',
        cursor: 'pointer',
        border: active ? '2px solid #3b82f6' : '1.5px solid #e2e8f0',
        background: active ? 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)' : '#ffffff',
        color: active ? '#1e40af' : '#64748b',
        boxShadow: active ? '0 2px 8px rgba(59, 130, 246, 0.15)' : '0 1px 3px rgba(0, 0, 0, 0.05)',
        whiteSpace: 'nowrap' as const,
      }}
    >
      {label}
    </button>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export function PageFilterToolbar({
  leftFilters,
  rightFilters = [],
  values,
  onChange,
  onApply,
  showClearButton = true,
  onClear,
  applyLabel = 'Apply',
  applyIcon = <Search size={14} />,
}: PageFilterToolbarProps) {
  const handleChange = (field: string, value: unknown) => {
    onChange({ ...values, [field]: value });
  };

  const handleChipToggle = (filter: ChipsFilter, optionValue: string) => {
    const currentValue = values[filter.field];
    if (filter.multi) {
      const current = Array.isArray(currentValue) ? currentValue : [];
      const next = current.includes(optionValue) ? current.filter((v) => v !== optionValue) : [...current, optionValue];
      handleChange(filter.field, next);
    } else {
      handleChange(filter.field, currentValue === optionValue ? null : optionValue);
    }
  };

  const isChipActive = (filter: ChipsFilter, optionValue: string): boolean => {
    const currentValue = values[filter.field];
    if (filter.multi) {
      return Array.isArray(currentValue) && currentValue.includes(optionValue);
    }
    return currentValue === optionValue;
  };

  const hasActiveFilters = Object.values(values).some((v) => {
    if (v == null) return false;
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === 'string') return v.trim().length > 0;
    return true;
  });

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        {/* Left Filters */}
        {leftFilters.map((filter, index) => (
          <div key={index} className="flex flex-wrap items-center gap-2">
            {filter.type === 'dateRange' && (
              <>
                {(filter as DateRangeFilter).inline ? (
                  <DateRangePickerPopover
                    filter={filter as DateRangeFilter}
                    fromValue={toDateValue(values[filter.fromField])}
                    toValue={toDateValue(values[filter.toField])}
                    onChange={(from, to) => {
                      handleChange(filter.fromField, from ? from.toISOString() : null);
                      handleChange(filter.toField, to ? to.toISOString() : null);
                    }}
                  />
                ) : (
                  <>
                    <DatePicker
                      value={toDatePickerValue(values[filter.fromField])}
                      onChange={(v) => handleChange(filter.fromField, v)}
                      maxDate={filter.maxDate}
                      placeholder={filter.fromPlaceholder || 'From Date'}
                      showTime={(filter as DateRangeFilter).showTime}
                    />
                    <span style={{ color: '#94A3B8', fontSize: 13 }}>to</span>
                    <DatePicker
                      value={toDatePickerValue(values[filter.toField])}
                      onChange={(v) => handleChange(filter.toField, v)}
                      maxDate={filter.maxDate}
                      placeholder={filter.toPlaceholder || 'To Date'}
                      showTime={(filter as DateRangeFilter).showTime}
                    />
                  </>
                )}
              </>
            )}

            {filter.type === 'timeRange' && (
              <>
                <input
                  type="time"
                  value={toInputValue(values[(filter as TimeRangeFilter).fromField])}
                  onChange={(e) => handleChange((filter as TimeRangeFilter).fromField, e.target.value)}
                  style={{
                    height: 34,
                    padding: '0 10px',
                    border: '1px solid #D2DBE6',
                    borderRadius: 8,
                    fontSize: 13,
                    fontFamily: 'Inter, sans-serif',
                    color: '#29313C',
                    background: '#fff',
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                />
                <span style={{ color: '#94A3B8', fontSize: 13 }}>to</span>
                <input
                  type="time"
                  value={toInputValue(values[(filter as TimeRangeFilter).toField])}
                  onChange={(e) => handleChange((filter as TimeRangeFilter).toField, e.target.value)}
                  style={{
                    height: 34,
                    padding: '0 10px',
                    border: '1px solid #D2DBE6',
                    borderRadius: 8,
                    fontSize: 13,
                    fontFamily: 'Inter, sans-serif',
                    color: '#29313C',
                    background: '#fff',
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                />
              </>
            )}

            {filter.type === 'dropdown' && (
              <div style={{ flex: '1 1 200px', minWidth: 150 }}>
                <Select
                  value={toSelectValue(values[filter.field])}
                  options={filter.options}
                  onChange={(v) => handleChange(filter.field, v || null)}
                  placeholder={filter.placeholder}
                  clearable={filter.clearable}
                  onClear={filter.clearable ? () => handleChange(filter.field, null) : undefined}
                />
              </div>
            )}

            {filter.type === 'input' && (
              <div style={{ flex: '1 1 200px', minWidth: 150 }}>
                <Input
                  type={filter.inputType || 'text'}
                  value={toInputValue(values[filter.field])}
                  onChange={(v) => handleChange(filter.field, v)}
                  placeholder={filter.placeholder}
                />
              </div>
            )}
          </div>
        ))}

        {/* Vertical Divider (if right filters exist) */}
        {rightFilters.length > 0 && <div style={{ width: 1, height: 32, background: '#E2E8F0' }} />}

        {/* Right Chip Filters */}
        {rightFilters.map((filter, index) => (
          <div key={index} className="flex flex-wrap items-center gap-1.5">
            {filter.options.map((opt) => (
              <FilterChip
                key={opt.value}
                label={opt.label}
                active={isChipActive(filter, opt.value)}
                onClick={() => handleChipToggle(filter, opt.value)}
              />
            ))}
            {index < rightFilters.length - 1 && (
              <div style={{ width: 1, height: 32, background: '#E2E8F0', marginLeft: 8, marginRight: 8 }} />
            )}
          </div>
        ))}

        {/* Actions */}
        <div className="flex items-center gap-2">
          {showClearButton && hasActiveFilters && onClear && (
            <Button variant="ghost" size="md" leftIcon={<X size={14} />} onClick={onClear}>
              Clear Filters
            </Button>
          )}
          {onApply && (
            <Button variant="primary" size="md" leftIcon={applyIcon ?? undefined} onClick={onApply}>
              {applyLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
