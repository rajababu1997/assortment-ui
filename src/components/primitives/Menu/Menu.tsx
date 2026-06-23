import { useCallback, useEffect, useId, useRef, useState } from 'react';
import clsx from 'clsx';
import styles from './Menu.module.css';
import type { MenuItem, MenuItemConfig, MenuProps } from './Menu.types';

const placementClass = {
  'bottom-start': styles.bottomStart,
  'bottom-end': styles.bottomEnd,
  'top-start': styles.topStart,
  'top-end': styles.topEnd,
} as const;

export function Menu({
  trigger,
  items,
  placement = 'bottom-start',
  minWidth = 180,
  closeOnSelect = true,
  className,
  ariaLabel = 'Menu',
}: MenuProps) {
  const reactId = useId();
  const menuId = `menu-${reactId}`;

  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);

  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const firstItemIndex = items.findIndex(isActivable);
  const lastItemIndex = findLastIndex(items, isActivable);

  const open = useCallback(
    (focusTarget: 'first' | 'last' = 'first') => {
      setIsOpen(true);
      setActiveIndex(focusTarget === 'first' ? firstItemIndex : lastItemIndex);
    },
    [firstItemIndex, lastItemIndex],
  );

  const close = useCallback((returnFocus = true) => {
    setIsOpen(false);
    setActiveIndex(-1);
    if (returnFocus) {
      const trig = triggerRef.current?.querySelector<HTMLElement>('button, [tabindex="0"], [role="button"]');
      trig?.focus();
    }
  }, []);

  const activate = useCallback(
    (item: MenuItemConfig) => {
      if (item.disabled) return;
      item.onClick();
      if (closeOnSelect) close();
    },
    [closeOnSelect, close],
  );

  useEffect(() => {
    if (!isOpen) return;
    const onMouseDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) close(false);
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [isOpen, close]);

  const onRootKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        open('first');
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        open('last');
      }
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      close();
      return;
    }
    if (e.key === 'Tab') {
      close(false);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => nextActivable(items, i, 1));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => nextActivable(items, i, -1));
      return;
    }
    if (e.key === 'Home') {
      e.preventDefault();
      setActiveIndex(firstItemIndex);
      return;
    }
    if (e.key === 'End') {
      e.preventDefault();
      setActiveIndex(lastItemIndex);
      return;
    }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const item = items[activeIndex];
      if (item && isActivable(item)) activate(item);
    }
  };

  return (
    <div
      ref={rootRef}
      className={clsx(styles.root, className)}
      onKeyDown={onRootKeyDown}
    >
      <div
        ref={triggerRef}
        className={styles.triggerSlot}
        onClick={() => (isOpen ? close(false) : open('first'))}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={menuId}
      >
        {trigger}
      </div>

      {isOpen && (
        <div
          ref={panelRef}
          id={menuId}
          role="menu"
          aria-label={ariaLabel}
          tabIndex={-1}
          style={{ minWidth }}
          className={clsx(styles.panel, placementClass[placement])}
        >
          {items.map((item, i) => {
            if (item.type === 'divider') {
              return <div key={item.id ?? `div-${i}`} className={styles.divider} role="separator" />;
            }
            if (item.type === 'header') {
              return (
                <div key={item.id ?? `hdr-${i}`} className={styles.header} role="presentation">
                  {item.label}
                </div>
              );
            }
            return (
              <button
                key={item.id}
                type="button"
                role="menuitem"
                disabled={item.disabled}
                aria-disabled={item.disabled}
                onMouseEnter={() => setActiveIndex(i)}
                onClick={() => activate(item)}
                className={clsx(
                  styles.item,
                  i === activeIndex && styles.itemActive,
                  item.disabled && styles.itemDisabled,
                  item.variant === 'danger' && styles.itemDanger,
                )}
              >
                {item.icon && <span className={styles.itemIcon} aria-hidden>{item.icon}</span>}
                <span className={styles.itemLabel}>{item.label}</span>
                {item.shortcut && <span className={styles.itemShortcut}>{item.shortcut}</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function isActivable(item: MenuItem): item is MenuItemConfig {
  return !('type' in item) || item.type === undefined || item.type === 'item';
}

function nextActivable(items: MenuItem[], from: number, direction: 1 | -1): number {
  const len = items.length;
  if (len === 0) return -1;
  let i = from;
  for (let step = 0; step < len; step++) {
    i = (i + direction + len) % len;
    const candidate = items[i];
    if (isActivable(candidate) && !candidate.disabled) return i;
  }
  return from;
}

function findLastIndex<T>(arr: T[], predicate: (item: T) => boolean): number {
  for (let i = arr.length - 1; i >= 0; i--) {
    if (predicate(arr[i])) return i;
  }
  return -1;
}
