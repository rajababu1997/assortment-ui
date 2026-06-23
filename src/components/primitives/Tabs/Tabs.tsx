import { useId, useRef, useState } from 'react';
import clsx from 'clsx';
import styles from './Tabs.module.css';
import type { TabsProps } from './Tabs.types';

export function Tabs({
  items,
  activeKey: controlledKey,
  defaultActiveKey,
  onChange,
  variant = 'line',
  className,
  panelClassName,
  tablistClassName,
  tablistStyle,
}: TabsProps) {
  const reactId = useId();
  const tablistRef = useRef<HTMLDivElement>(null);

  const [internalKey, setInternalKey] = useState(
    defaultActiveKey ?? items.find((t) => !t.disabled)?.key ?? '',
  );

  const activeKey = controlledKey ?? internalKey;

  const activate = (key: string) => {
    if (!controlledKey) setInternalKey(key);
    onChange?.(key);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const enabledKeys = items.filter((t) => !t.disabled).map((t) => t.key);
    const currentIndex = enabledKeys.indexOf(activeKey);
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      activate(enabledKeys[(currentIndex + 1) % enabledKeys.length]);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      activate(enabledKeys[(currentIndex - 1 + enabledKeys.length) % enabledKeys.length]);
    } else if (e.key === 'Home') {
      e.preventDefault();
      activate(enabledKeys[0]);
    } else if (e.key === 'End') {
      e.preventDefault();
      activate(enabledKeys[enabledKeys.length - 1]);
    }
  };

  const activeItem = items.find((t) => t.key === activeKey);

  return (
    <div className={clsx(styles.root, styles[`variant${variant.charAt(0).toUpperCase()}${variant.slice(1)}`], className)}>
      <div
        ref={tablistRef}
        role="tablist"
        onKeyDown={onKeyDown}
        className={clsx(styles.tablist, tablistClassName)}
        style={tablistStyle}
      >
        {items.map((item) => {
          const tabId = `${reactId}-tab-${item.key}`;
          const panelId = `${reactId}-panel-${item.key}`;
          const isActive = item.key === activeKey;
          return (
            <button
              key={item.key}
              id={tabId}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={panelId}
              aria-disabled={item.disabled}
              disabled={item.disabled}
              tabIndex={isActive ? 0 : -1}
              onClick={() => !item.disabled && activate(item.key)}
              className={clsx(
                styles.tab,
                isActive && styles.tabActive,
                item.disabled && styles.tabDisabled,
              )}
            >
              {item.icon && (
                <span className={styles.tabIcon} aria-hidden>
                  {item.icon}
                </span>
              )}

              {item.label}

              {item.badge != null && (
                <span className={styles.badge} aria-label={`${item.badge} items`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {activeItem && (
        <div
          id={`${reactId}-panel-${activeItem.key}`}
          role="tabpanel"
          aria-labelledby={`${reactId}-tab-${activeItem.key}`}
          className={clsx(styles.panel, panelClassName)}
        >
          {activeItem.content}
        </div>
      )}
    </div>
  );
}
