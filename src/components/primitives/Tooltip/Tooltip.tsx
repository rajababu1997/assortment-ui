import { useRef, useState, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import styles from './Tooltip.module.css';
import type { TooltipProps } from './Tooltip.types';

export function Tooltip({
  children,
  content,
  placement = 'top',
  maxWidth = 240,
  portal = false,
  className,
  wrapStyle,
}: TooltipProps) {
  // Always initialize hooks to maintain consistent hook calls
  const wrapRef = useRef<HTMLSpanElement>(null);
  const bubbleRef = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    if (!portal || !open || !wrapRef.current || !bubbleRef.current) return;
    const anchor = wrapRef.current.getBoundingClientRect();
    const bubble = bubbleRef.current.getBoundingClientRect();
    const gap = 7;
    let top = 0, left = 0;
    switch (placement) {
      case 'top':
        top = anchor.top - bubble.height - gap;
        left = anchor.left + anchor.width / 2 - bubble.width / 2;
        break;
      case 'bottom':
        top = anchor.bottom + gap;
        left = anchor.left + anchor.width / 2 - bubble.width / 2;
        break;
      case 'left':
        top = anchor.top + anchor.height / 2 - bubble.height / 2;
        left = anchor.left - bubble.width - gap;
        break;
      case 'right':
        top = anchor.top + anchor.height / 2 - bubble.height / 2;
        left = anchor.right + gap;
        break;
    }
    // Viewport-clamp
    const pad = 4;
    left = Math.max(pad, Math.min(left, window.innerWidth - bubble.width - pad));
    top = Math.max(pad, Math.min(top, window.innerHeight - bubble.height - pad));
    setPos({ top, left });
  }, [portal, open, placement, content]);

  if (!content) return <>{children}</>;

  // Non-portal: simple CSS hover
  if (!portal) {
    return (
      <span className={clsx(styles.wrap, className)} style={wrapStyle}>
        {children}
        <span
          className={clsx(styles.bubble, styles[placement])}
          role="tooltip"
          style={{ maxWidth }}
        >
          {content}
        </span>
      </span>
    );
  }

  // Portal: dynamic positioning
  return (
    <>
      <span
        ref={wrapRef}
        className={clsx(styles.wrap, className)}
        style={wrapStyle}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        {children}
      </span>
      {open && createPortal(
        <span
          ref={bubbleRef}
          className={clsx(styles.bubble, styles[placement], styles.portalBubble)}
          role="tooltip"
          style={{
            maxWidth,
            position: 'fixed',
            top: pos?.top ?? -9999,
            left: pos?.left ?? -9999,
            opacity: pos ? 1 : 0,
            visibility: 'visible',
          }}
        >
          {content}
        </span>,
        document.body,
      )}
    </>
  );
}

