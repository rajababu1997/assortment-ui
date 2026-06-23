import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import styles from './SegmentedControl.module.css';
import type { SegmentedControlProps } from './SegmentedControl.types';

const variantClass = {
  primary: styles.variantPrimary,
  cyan:    styles.variantCyan,
  solid:   styles.variantSolid,
};

const sizeClass = {
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
};

export function SegmentedControl<T extends string | number = string>({
  options,
  value,
  onChange,
  label,
  size = 'md',
  fullWidth = false,
  disabled = false,
  variant = 'cyan',
  className,
  ariaLabel,
}: SegmentedControlProps<T>) {
  const trayRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [indicator, setIndicator] = useState<{ left: number; width: number } | null>(null);

  const activeIdx = options.findIndex((o) => o.value === value);

  /* Stable updater — reads current DOM, no deps captured */
  const updateIndicator = useCallback(() => {
    const tray = trayRef.current;
    const btn = optionRefs.current[activeIdx];
    if (!tray || !btn || activeIdx < 0) { setIndicator(null); return; }
    const trayRect = tray.getBoundingClientRect();
    const btnRect  = btn.getBoundingClientRect();
    setIndicator({ left: btnRect.left - trayRect.left, width: btnRect.width });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIdx]);

  /* Synchronous first paint — avoids indicator flash on initial render */
  useLayoutEffect(() => {
    updateIndicator();
  }, [updateIndicator]);

  /* Stable ResizeObserver — uses a ref to always call the latest updater */
  const updateRef = useRef(updateIndicator);
  updateRef.current = updateIndicator;

  useEffect(() => {
    const tray = trayRef.current;
    if (!tray) return;
    const ro = new ResizeObserver(() => updateRef.current());
    ro.observe(tray);
    return () => ro.disconnect();
  }, []); // intentionally empty — observer is stable, updater via ref

  return (
    <div className={clsx(styles.wrap, fullWidth && styles.wrapFullWidth, className)}>
      {label && <span className={styles.label}>{label}</span>}

      <div
        ref={trayRef}
        role="radiogroup"
        aria-label={ariaLabel ?? label}
        className={clsx(
          styles.tray,
          sizeClass[size],
          variantClass[variant],
          fullWidth && styles.trayFullWidth,
          disabled && styles.trayDisabled,
        )}
      >
        {/* Sliding pill indicator */}
        {indicator && (
          <span
            aria-hidden="true"
            className={styles.indicator}
            style={{ left: indicator.left, width: indicator.width }}
          />
        )}

        {options.map((opt, idx) => {
          const isActive = opt.value === value;
          return (
            <button
              key={String(opt.value)}
              ref={(el) => { optionRefs.current[idx] = el; }}
              type="button"
              role="radio"
              aria-checked={isActive}
              disabled={disabled || opt.disabled}
              className={clsx(styles.option, isActive && styles.optionActive)}
              onClick={() => { if (!isActive) onChange(opt.value); }}
            >
              {opt.icon}
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
