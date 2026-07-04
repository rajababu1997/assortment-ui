/**
 * Filter bar — two compact multi-select dropdowns (Category, Month).
 * Selected values render as removable tokens under the dropdowns so the
 * whole panel stays compact regardless of how many are picked.
 */

import { Filter, RotateCcw, X } from 'lucide-react';
import { MultiSelect } from '@/components/primitives';
import type { SignalCategory } from '../types';
import { CATEGORY_LABEL, CATEGORY_TONE, monthName } from '../utils';

export interface CalendarFilters {
  categories: Set<SignalCategory>;
  months: Set<number>;
}

interface Props {
  filters: CalendarFilters;
  setFilters: (next: CalendarFilters) => void;
  availableCategories: SignalCategory[];
  availableMonths: number[];
  onClose?: () => void;
}

export function FilterBar({ filters, setFilters, availableCategories, availableMonths, onClose }: Props) {
  const setCategories = (values: SignalCategory[]) =>
    setFilters({ ...filters, categories: new Set(values) });
  const setMonths = (values: number[]) =>
    setFilters({ ...filters, months: new Set(values) });

  const removeCategory = (c: SignalCategory) => {
    const next = new Set(filters.categories);
    next.delete(c);
    setFilters({ ...filters, categories: next });
  };
  const removeMonth = (m: number) => {
    const next = new Set(filters.months);
    next.delete(m);
    setFilters({ ...filters, months: next });
  };
  const resetAll = () => setFilters({ categories: new Set(), months: new Set() });

  const activeCount = filters.categories.size + filters.months.size;
  const anyActive = activeCount > 0;

  const categoryOptions = availableCategories.map((c) => ({
    value: c as string,
    label: CATEGORY_LABEL[c],
  }));
  const monthOptions = availableMonths.map((m) => ({
    value: String(m),
    label: monthName(m),
  }));

  return (
    <div
      className="rounded-xl border bg-white shadow-sm"
      style={{ borderColor: 'var(--color-divider)' }}
    >
      {/* Toolbar */}
      <div
        className="flex items-center justify-between gap-2 rounded-t-xl border-b px-4 py-2"
        style={{
          borderColor: 'var(--color-divider)',
          background: 'linear-gradient(90deg, rgba(96,165,250,0.10), rgba(167,139,250,0.04))',
        }}
      >
        <div className="flex items-center gap-2">
          <span
            className="flex h-6 w-6 items-center justify-center rounded-md"
            style={{
              background: 'color-mix(in srgb, var(--color-primary) 14%, transparent)',
              color: 'var(--color-primary)',
            }}
          >
            <Filter size={12} />
          </span>
          <h3 className="text-[12px] font-semibold"
            style={{ color: 'var(--color-text-primary)' }}>
            Filters
          </h3>
          {anyActive && (
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums"
              style={{
                background: 'color-mix(in srgb, var(--color-primary) 14%, transparent)',
                color: 'var(--color-primary)',
              }}
            >
              {activeCount}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={resetAll}
            disabled={!anyActive}
            className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium transition-opacity disabled:opacity-40"
            style={{
              borderColor: 'var(--color-divider)',
              color: 'var(--color-text-secondary)',
              background: 'var(--color-surface)',
            }}
          >
            <RotateCcw size={11} /> Reset
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Hide filters"
              title="Hide filters"
              className="flex h-7 w-7 items-center justify-center rounded-md border transition-colors hover:bg-[var(--color-surface-alt,#f1f5f9)]"
              style={{
                borderColor: 'var(--color-divider)',
                color: 'var(--color-text-secondary)',
                background: 'var(--color-surface)',
              }}
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Dropdowns */}
      <div className="grid grid-cols-1 gap-3 px-4 py-3 md:grid-cols-2">
        <MultiSelect
          label="Category"
          value={Array.from(filters.categories)}
          onChange={(v) => setCategories(v as SignalCategory[])}
          options={categoryOptions}
          placeholder="All categories"
          maxChips={0}
        />
        <MultiSelect
          label="Month"
          value={Array.from(filters.months).map(String)}
          onChange={(v) => setMonths(v.map((s) => Number(s)))}
          options={monthOptions}
          placeholder="All months"
          maxChips={0}
        />
      </div>

      {/* Selected tokens */}
      {anyActive && (
        <div
          className="flex flex-wrap items-center gap-1.5 border-t px-4 py-2.5"
          style={{ borderColor: 'var(--color-divider)', background: 'var(--color-surface-alt, #f8fafc)' }}
        >
          <span
            className="text-[10px] font-bold uppercase tracking-[0.10em]"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            Active
          </span>
          {Array.from(filters.categories).map((c) => {
            const tone = CATEGORY_TONE[c];
            return (
              <Token
                key={`c-${c}`}
                bg={tone.bg}
                fg={tone.fg}
                border={tone.border}
                onRemove={() => removeCategory(c)}
              >
                {CATEGORY_LABEL[c]}
              </Token>
            );
          })}
          {Array.from(filters.months).sort((a, b) => a - b).map((m) => (
            <Token
              key={`m-${m}`}
              bg="rgba(96,165,250,0.14)"
              fg="#1d4ed8"
              border="rgba(96,165,250,0.32)"
              onRemove={() => removeMonth(m)}
            >
              {monthName(m)}
            </Token>
          ))}
        </div>
      )}
    </div>
  );
}

interface TokenProps {
  bg: string;
  fg: string;
  border: string;
  children: React.ReactNode;
  onRemove: () => void;
}

function Token({ bg, fg, border, children, onRemove }: TokenProps) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full border pl-2 pr-1 py-0.5 text-[11px] font-medium"
      style={{ background: bg, color: fg, borderColor: border }}
    >
      {children}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${children}`}
        className="flex h-4 w-4 items-center justify-center rounded-full transition-colors hover:bg-black/10"
      >
        <X size={10} />
      </button>
    </span>
  );
}
