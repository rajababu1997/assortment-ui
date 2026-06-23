import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import { ChevronDown, X, Info, Search } from 'lucide-react';
import { Tooltip } from '../Tooltip';
import field from '../_shared/field.module.css';
import styles from './MultiSelect.module.css';
import type { MultiSelectOption, MultiSelectProps } from './MultiSelect.types';

interface PanelRect {
  top: number;
  bottom: number;
  left: number;
  width: number;
  above: boolean;
}

export function MultiSelect<V extends string | number = string>({
  label,
  value,
  onChange,
  options,
  placeholder = 'Select options',
  error,
  hasError = false,
  disabled = false,
  required,
  searchable,
  maxChips = 3,
  id,
  className,
  infoText,
  renderOption,
}: MultiSelectProps<V>) {
  const reactId = useId();
  const triggerId = id ?? `ms-${reactId}`;
  const listboxId = `${triggerId}-listbox`;
  const errorId = `${triggerId}-error`;

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const [panelRect, setPanelRect] = useState<PanelRect | null>(null);

  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const showSearch = searchable ?? options.length > 4;
  const selected = new Set<V>(value);

  const filtered = query ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase())) : options;

  const calcRect = useCallback((): PanelRect | null => {
    if (!triggerRef.current) return null;
    const r = triggerRef.current.getBoundingClientRect();
    const PANEL_H = 280;
    const GAP = 4;
    const MAX_PANEL_W = 320;
    const VIEWPORT_MARGIN = 8;
    const spaceBelow = window.innerHeight - r.bottom - GAP;
    const above = spaceBelow < PANEL_H && r.top > PANEL_H;

    const idealWidth = Math.max(r.width, Math.min(MAX_PANEL_W, r.width + 120));
    const overflowRight = r.left + idealWidth - (window.innerWidth - VIEWPORT_MARGIN);
    const left = overflowRight > 0 ? Math.max(VIEWPORT_MARGIN, r.left - overflowRight) : r.left;

    return {
      top: above ? 0 : r.bottom + GAP,
      bottom: above ? window.innerHeight - r.top + GAP : 0,
      left,
      width: idealWidth,
      above,
    };
  }, []);

  const open = useCallback(() => {
    if (disabled) return;
    const rect = calcRect();
    setPanelRect(rect);
    setIsOpen(true);
    setActiveIndex(-1);
    setTimeout(() => searchRef.current?.focus(), 30);
  }, [disabled, calcRect]);

  // Reposition on scroll/resize while open
  useLayoutEffect(() => {
    if (!isOpen) return;
    const update = () => setPanelRect(calcRect());
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [isOpen, calcRect]);

  const close = useCallback(() => {
    setIsOpen(false);
    setQuery('');
    setPanelRect(null);
  }, []);

  const toggle = (opt: MultiSelectOption<V>) => {
    if (opt.disabled) return;
    if (selected.has(opt.value)) {
      onChange(value.filter((v) => v !== opt.value));
    } else {
      onChange([...value, opt.value]);
    }
  };

  const allVisibleSelected = filtered.every((o) => selected.has(o.value));
  const toggleAll = () => {
    if (allVisibleSelected) {
      onChange(value.filter((v) => !filtered.some((o) => o.value === v)));
    } else {
      const toAdd = filtered.filter((o) => !selected.has(o.value)).map((o) => o.value);
      onChange([...value, ...toAdd]);
    }
  };

  // Close on outside click (must also exclude the portalled panel)
  useEffect(() => {
    if (!isOpen) return;
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (rootRef.current && !rootRef.current.contains(target) && !document.getElementById(listboxId)?.contains(target))
        close();
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [isOpen, close, listboxId]);

  const onPanelKeyDown = (e: ReactKeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      const opt = filtered[activeIndex];
      if (opt) toggle(opt);
    }
  };

  const visibleChips = value.slice(0, maxChips);
  const overflowCount = value.length - maxChips;
  const chipLabels = new Map(options.map((o) => [o.value, o.label]));

  return (
    <div ref={rootRef} className={clsx(field.root, className)}>
      {label && (
        <label htmlFor={triggerId} className={field.label}>
          {label}
          {required && (
            <span className={field.required} aria-hidden>
              *
            </span>
          )}
          {infoText && (
            <Tooltip portal content={infoText} placement="top">
              <span className={field.infoIcon}>
                <Info aria-hidden />
              </span>
            </Tooltip>
          )}
        </label>
      )}

      <div className={styles.triggerWrap}>
        <button
          ref={triggerRef}
          id={triggerId}
          type="button"
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          disabled={disabled}
          onClick={() => (isOpen ? close() : open())}
          className={clsx(
            field.container,
            styles.trigger,
            isOpen && field.containerFocused,
            (error || hasError) && field.containerError,
            disabled && field.containerDisabled,
            disabled && styles.triggerDisabled
          )}
        >
          <span className={styles.chipsWrap}>
            {value.length === 0 ? (
              <span className={styles.placeholder}>{placeholder}</span>
            ) : (
              <>
                {visibleChips.map((v) => (
                  <span key={String(v)} className={styles.chip}>
                    <span className={styles.chipLabel}>{chipLabels.get(v) ?? String(v)}</span>
                    {!disabled && (
                      <span
                        role="button"
                        className={styles.chipRemove}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          onChange(value.filter((x) => x !== v));
                        }}
                        aria-label={`Remove ${chipLabels.get(v)}`}
                        tabIndex={-1}
                      >
                        <X />
                      </span>
                    )}
                  </span>
                ))}
                {overflowCount > 0 && <span className={styles.chipMore}>+{overflowCount}</span>}
              </>
            )}
          </span>
          <ChevronDown className={clsx(styles.chevron, isOpen && styles.chevronOpen)} strokeWidth={1.6} aria-hidden />
        </button>
      </div>

      {isOpen &&
        panelRect &&
        createPortal(
          <div
            id={listboxId}
            role="listbox"
            aria-multiselectable="true"
            onKeyDown={onPanelKeyDown}
            className={clsx(styles.panel, panelRect.above && styles.panelAbove)}
            style={{
              position: 'fixed',
              top: panelRect.above ? undefined : panelRect.top,
              bottom: panelRect.above ? panelRect.bottom : undefined,
              left: panelRect.left,
              minWidth: panelRect.width,
              width: panelRect.width,
              zIndex: 9999,
            }}
          >
            <div className={styles.panelInner}>
              {showSearch && (
                <div className={styles.searchWrap}>
                  <Search className={styles.searchIcon} aria-hidden />
                  <input
                    ref={searchRef}
                    type="text"
                    placeholder="Search…"
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setActiveIndex(-1);
                    }}
                    className={styles.searchInput}
                  />
                </div>
              )}

              {filtered.length > 1 && (
                <button type="button" onClick={toggleAll} className={styles.selectAll}>
                  {allVisibleSelected ? 'Deselect all' : 'Select all'}
                </button>
              )}

              <div className={styles.optionsList}>
                {filtered.length === 0 ? (
                  <div className={styles.optionEmpty}>No results</div>
                ) : (
                  filtered.map((opt, i) => {
                    const isChecked = selected.has(opt.value);
                    return (
                      <button
                        key={String(opt.value)}
                        type="button"
                        role="option"
                        aria-selected={isChecked}
                        aria-disabled={opt.disabled}
                        onClick={() => toggle(opt)}
                        onMouseEnter={() => setActiveIndex(i)}
                        className={clsx(
                          styles.option,
                          i === activeIndex && styles.optionActive,
                          opt.disabled && styles.optionDisabled,
                          renderOption && styles.optionCustom
                        )}
                      >
                        <span
                          className={clsx(styles.optionCheckbox, isChecked && styles.optionCheckboxChecked)}
                          aria-hidden
                        >
                          {isChecked && (
                            <svg
                              viewBox="0 0 12 12"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={2}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polyline points="1.5,6 4.5,9 10.5,3" />
                            </svg>
                          )}
                        </span>
                        {renderOption ? (
                          renderOption(opt, isChecked)
                        ) : (
                          <span className={styles.optionLabel}>{opt.label}</span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>,
          document.body
        )}

      {error && (
        <div id={errorId} className={field.errorMessage} role="alert">
          {error}
        </div>
      )}
    </div>
  );
}
