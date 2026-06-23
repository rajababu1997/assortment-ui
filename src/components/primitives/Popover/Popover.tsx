import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import styles from './Popover.module.css';
import type { PopoverPlacement, PopoverProps } from './Popover.types';

export function Popover({
  trigger,
  children,
  open: openProp,
  onOpenChange,
  defaultOpen = false,
  placement = 'bottom-start',
  offset = 8,
  minWidth = 220,
  maxWidth = 360,
  closeOnOutsideClick = true,
  closeOnEscape = true,
  ariaLabel,
  panelClassName,
  className,
}: PopoverProps) {
  const isControlled = openProp !== undefined;
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const open = isControlled ? openProp : uncontrolledOpen;

  const setOpen = useCallback(
    (next: boolean) => {
      if (!isControlled) setUncontrolledOpen(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange],
  );

  const reactId = useId();
  const panelId = `popover-${reactId}`;

  const triggerRef = useRef<HTMLSpanElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  /* Measure and position the panel */
  useLayoutEffect(() => {
    if (!open || !triggerRef.current || !panelRef.current) return;
    const tRect = triggerRef.current.getBoundingClientRect();
    const pRect = panelRef.current.getBoundingClientRect();
    setPosition(computePosition(tRect, pRect, placement, offset));
  }, [open, placement, offset]);

  /* Reposition on window resize / scroll while open */
  useEffect(() => {
    if (!open) return;
    const update = () => {
      if (!triggerRef.current || !panelRef.current) return;
      const tRect = triggerRef.current.getBoundingClientRect();
      const pRect = panelRef.current.getBoundingClientRect();
      setPosition(computePosition(tRect, pRect, placement, offset));
    };
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [open, placement, offset]);

  /* Click outside */
  useEffect(() => {
    if (!open || !closeOnOutsideClick) return;
    const onMouseDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (panelRef.current?.contains(t)) return;
      if (triggerRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [open, closeOnOutsideClick, setOpen]);

  /* Escape */
  useEffect(() => {
    if (!open || !closeOnEscape) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        (triggerRef.current?.querySelector('button, [tabindex="0"], [role="button"]') as HTMLElement | null)?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, closeOnEscape, setOpen]);

  const toggle = () => setOpen(!open);

  return (
    <>
      <span
        ref={triggerRef}
        className={clsx(styles.triggerWrap, className)}
        onClick={toggle}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={panelId}
      >
        {trigger}
      </span>

      {open &&
        createPortal(
          <div
            ref={panelRef}
            id={panelId}
            role="dialog"
            aria-label={ariaLabel}
            tabIndex={-1}
            className={clsx(styles.panel, panelClassName)}
            style={{
              top: position?.top ?? -9999,
              left: position?.left ?? -9999,
              minWidth,
              maxWidth,
              visibility: position ? 'visible' : 'hidden',
            }}
          >
            {children}
          </div>,
          document.body,
        )}
    </>
  );
}

function computePosition(
  trigger: DOMRect,
  panel: DOMRect,
  placement: PopoverPlacement,
  offset: number,
): { top: number; left: number } {
  const vpW = window.innerWidth;
  const vpH = window.innerHeight;
  let top = 0;
  let left = 0;

  switch (placement) {
    case 'bottom-start':
      top = trigger.bottom + offset;
      left = trigger.left;
      break;
    case 'bottom-end':
      top = trigger.bottom + offset;
      left = trigger.right - panel.width;
      break;
    case 'bottom':
      top = trigger.bottom + offset;
      left = trigger.left + trigger.width / 2 - panel.width / 2;
      break;
    case 'top-start':
      top = trigger.top - panel.height - offset;
      left = trigger.left;
      break;
    case 'top-end':
      top = trigger.top - panel.height - offset;
      left = trigger.right - panel.width;
      break;
    case 'top':
      top = trigger.top - panel.height - offset;
      left = trigger.left + trigger.width / 2 - panel.width / 2;
      break;
    case 'left':
      top = trigger.top + trigger.height / 2 - panel.height / 2;
      left = trigger.left - panel.width - offset;
      break;
    case 'right':
      top = trigger.top + trigger.height / 2 - panel.height / 2;
      left = trigger.right + offset;
      break;
  }

  /* Viewport clamping — keep panel on-screen */
  const margin = 8;
  left = Math.max(margin, Math.min(left, vpW - panel.width - margin));
  top = Math.max(margin, Math.min(top, vpH - panel.height - margin));

  return { top, left };
}
