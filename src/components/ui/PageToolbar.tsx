import type { ReactNode } from 'react';

interface PageToolbarProps {
  children: ReactNode;
}

/**
 * Shared page toolbar container — consistent card styling across all pages.
 * Place role selectors, filters, action buttons, etc. as children.
 */
export function PageToolbar({ children }: PageToolbarProps) {
  return (
    <div
      className="flex items-center gap-3 flex-wrap p-3 rounded-xl border"
      style={{
        backgroundColor: 'var(--surface-card)',
        borderColor: 'var(--surface-border)',
        boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.04)',
      }}
    >
      {children}
    </div>
  );
}
