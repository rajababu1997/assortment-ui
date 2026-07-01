/**
 * Tiny "info" button you drop next to a section title. Clicking it opens
 * a centered dialog with whatever rich content the section provides —
 * usually a short explanation of what the widget shows, what filters it
 * respects, and how to read the numbers.
 *
 * Self-contained dialog (portal-mounted, ESC to close, click-backdrop to
 * close) — saves us from threading a global modal slot through the page.
 */

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Info, X } from 'lucide-react';

export function SectionInfoButton({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-5 w-5 items-center justify-center rounded-full transition-colors"
        style={{ color: 'var(--color-text-tertiary)' }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-primary)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-tertiary)')}
        aria-label={`About ${title}`}
        title={`What does this show?`}
      >
        <Info size={13} />
      </button>
      {open && <InfoDialog title={title} onClose={() => setOpen(false)}>{children}</InfoDialog>}
    </>
  );
}

function InfoDialog({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    // Lock body scroll while the dialog is open
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(2px)' }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[80vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border shadow-xl"
        style={{
          background: 'var(--color-surface)',
          borderColor: 'var(--color-divider)',
        }}
      >
        <header
          className="flex items-center justify-between gap-3 border-b px-4 py-3"
          style={{
            borderColor: 'var(--color-divider)',
            background: 'linear-gradient(90deg, rgba(96,165,250,0.10), rgba(167,139,250,0.05))',
          }}
        >
          <div className="flex items-center gap-2">
            <span
              className="flex h-7 w-7 items-center justify-center rounded-lg"
              style={{
                background: 'linear-gradient(135deg, rgba(96,165,250,0.18), rgba(167,139,250,0.18))',
                color: 'var(--color-primary)',
              }}
            >
              <Info size={14} />
            </span>
            <h2
              className="text-[14px] font-semibold leading-tight"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-[rgba(0,0,0,0.06)]"
            style={{ color: 'var(--color-text-tertiary)' }}
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </header>
        <div
          className="flex-1 overflow-y-auto px-5 py-4 text-[12.5px] leading-relaxed"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
