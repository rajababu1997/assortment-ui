import React, { useEffect, useId, useLayoutEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import { ChevronDown, Search, Info, X } from 'lucide-react';
import { Tooltip } from '../Tooltip';
import field from '../_shared/field.module.css';
import styles from './Select.module.css';
import type { SelectOption, SelectProps } from './Select.types';

interface PanelRect {
  top: number;
  bottom: number;
  left: number;
  width: number;
  above: boolean;
}

export function Select<V extends string | number = string>({
  label,
  value,
  onChange,
  options,
  placeholder = 'Text here',
  error,
  hasError = false,
  disabled = false,
  id,
  name,
  required,
  className,
  renderOption,
  searchable,
  infoText,
  clearable,
  onClear,
}: SelectProps<V>) {
  const reactId = useId();
  const triggerId = id ?? `select-${reactId}`;
  const errorId = `${triggerId}-error`;
  const listboxId = `${triggerId}-listbox`;

  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [query, setQuery] = useState('');
  const [panelRect, setPanelRect] = useState<PanelRect | null>(null);

  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const showSearch = searchable ?? options.length > 5;
  const filtered = query ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase())) : options;

  const selectedIndex = options.findIndex((o) => o.value === value);
  const selectedOption = selectedIndex >= 0 ? options[selectedIndex] : null;

  const calcRect = useCallback((): PanelRect | null => {
    if (!triggerRef.current) return null;
    const r = triggerRef.current.getBoundingClientRect();
    const PANEL_H = 240;
    const GAP = 4;
    const MAX_PANEL_W = 320;
    const VIEWPORT_MARGIN = 8;
    const spaceBelow = window.innerHeight - r.bottom - GAP;
    const above = spaceBelow < PANEL_H && r.top > PANEL_H;

    // Prefer opening left-aligned with trigger; shift left if it would overflow viewport right
    const idealLeft = r.left;
    const idealWidth = Math.max(r.width, Math.min(MAX_PANEL_W, r.width + 120));
    const overflowRight = idealLeft + idealWidth - (window.innerWidth - VIEWPORT_MARGIN);
    const left = overflowRight > 0 ? Math.max(VIEWPORT_MARGIN, idealLeft - overflowRight) : idealLeft;

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
    setQuery('');
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
    setTimeout(() => searchRef.current?.focus(), 30);
  }, [disabled, selectedIndex, calcRect]);

  const close = useCallback(() => {
    setIsOpen(false);
    setActiveIndex(-1);
    setQuery('');
    setPanelRect(null);
  }, []);

  const selectOption = useCallback(
    (option: SelectOption<V>) => {
      if (option.disabled) return;
      onChange(option.value);
      close();
      triggerRef.current?.focus();
    },
    [onChange, close]
  );

  // Reposition on scroll / resize while open
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

  // Close on outside click
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

  const onTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      open();
    } else if (e.key === 'Escape' && isOpen) {
      e.preventDefault();
      close();
    }
  };

  const onPanelKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!isOpen) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
      triggerRef.current?.focus();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => findNextEnabled(filtered, i, 1));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => findNextEnabled(filtered, i, -1));
      return;
    }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const opt = filtered[activeIndex];
      if (opt) selectOption(opt);
    }
  };

  const panel =
    isOpen && panelRect
      ? createPortal(
          <div
            id={listboxId}
            role="listbox"
            tabIndex={-1}
            aria-activedescendant={activeIndex >= 0 ? `${triggerId}-opt-${activeIndex}` : undefined}
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
              animation: 'slideDown 160ms ease-out',
            }}
          >
            {showSearch && (
              <div className={styles.searchWrap}>
                <Search className={styles.searchIcon} size={14} strokeWidth={1.8} aria-hidden />
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Search…"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setActiveIndex(0);
                  }}
                  className={styles.searchInput}
                  onKeyDown={(e) => e.stopPropagation()}
                />
              </div>
            )}

            {filtered.length === 0 ? (
              <div className={styles.optionEmpty}>No results</div>
            ) : (
              filtered.map((opt, i) => {
                const isSelected = opt.value === value;
                const isActive = i === activeIndex;
                return (
                  <button
                    key={String(opt.value)}
                    id={`${triggerId}-opt-${i}`}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    aria-disabled={opt.disabled}
                    disabled={opt.disabled}
                    onMouseEnter={() => setActiveIndex(i)}
                    onClick={() => selectOption(opt)}
                    className={clsx(
                      styles.option,
                      isSelected && styles.optionSelected,
                      isActive && styles.optionActive,
                      opt.disabled && styles.optionDisabled
                    )}
                  >
                    {renderOption ? renderOption(opt) : <span className={styles.optionLabel}>{opt.label}</span>}
                  </button>
                );
              })
            )}
          </div>,
          document.body
        )
      : null;

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
          aria-controls={listboxId}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          aria-disabled={disabled}
          disabled={disabled}
          name={name}
          onClick={() => (isOpen ? close() : open())}
          onKeyDown={onTriggerKeyDown}
          className={clsx(
            field.container,
            styles.trigger,
            isOpen && field.containerFocused,
            (error || hasError) && field.containerError,
            disabled && field.containerDisabled,
            disabled && styles.triggerDisabled
          )}
        >
          <div className={styles.valueWrap}>
            {selectedOption ? (
              <span className={styles.value}>{selectedOption.label}</span>
            ) : (
              <span className={styles.placeholder}>{placeholder}</span>
            )}
          </div>
          {clearable && selectedOption && (
            <span
              role="button"
              className={styles.clearBtn}
              aria-label="Clear selection"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                if (isOpen) close();
                onClear?.();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.stopPropagation();
                  e.preventDefault();
                  if (isOpen) close();
                  onClear?.();
                }
              }}
            >
              <X size={10} strokeWidth={2.5} />
            </span>
          )}
          <ChevronDown className={clsx(styles.chevron, isOpen && styles.chevronOpen)} strokeWidth={1.6} aria-hidden />
        </button>
      </div>

      {panel}

      {error && (
        <div id={errorId} className={field.errorMessage} role="alert">
          {error}
        </div>
      )}
    </div>
  );
}

function findNextEnabled<V extends string | number>(
  options: SelectOption<V>[],
  from: number,
  direction: 1 | -1
): number {
  const len = options.length;
  if (len === 0) return -1;
  let i = from;
  for (let step = 0; step < len; step++) {
    i = (i + direction + len) % len;
    if (!options[i].disabled) return i;
  }
  return from;
}
