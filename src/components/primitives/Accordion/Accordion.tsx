import { useId, useState } from 'react';
import clsx from 'clsx';
import { ChevronDown } from 'lucide-react';
import styles from './Accordion.module.css';
import type { AccordionProps } from './Accordion.types';

export function Accordion({
  items,
  multiple = false,
  defaultOpenKeys = [],
  openKeys: controlledKeys,
  onChange,
  className,
}: AccordionProps) {
  const reactId = useId();
  const [internalKeys, setInternalKeys] = useState<string[]>(defaultOpenKeys);

  const openKeys = controlledKeys ?? internalKeys;

  const toggle = (key: string) => {
    let next: string[];
    if (openKeys.includes(key)) {
      next = openKeys.filter((k) => k !== key);
    } else {
      next = multiple ? [...openKeys, key] : [key];
    }
    if (!controlledKeys) setInternalKeys(next);
    onChange?.(next);
  };

  return (
    <div className={clsx(styles.root, className)}>
      {items.map((item) => {
        const isOpen = openKeys.includes(item.key);
        const triggerId = `${reactId}-trigger-${item.key}`;
        const panelId = `${reactId}-panel-${item.key}`;

        return (
          <div key={item.key} className={styles.item}>
            <button
              id={triggerId}
              type="button"
              aria-expanded={isOpen}
              aria-controls={panelId}
              aria-disabled={item.disabled}
              disabled={item.disabled}
              onClick={() => !item.disabled && toggle(item.key)}
              className={clsx(
                styles.trigger,
                isOpen && styles.triggerOpen,
                item.disabled && styles.triggerDisabled,
              )}
            >
              <span>{item.header}</span>
              <ChevronDown
                className={clsx(styles.chevron, isOpen && styles.chevronOpen)}
                strokeWidth={1.8}
                aria-hidden
              />
            </button>

            <div
              id={panelId}
              role="region"
              aria-labelledby={triggerId}
              className={clsx(styles.panel, isOpen && styles.panelOpen)}
            >
              <div className={styles.body}>{item.content}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
