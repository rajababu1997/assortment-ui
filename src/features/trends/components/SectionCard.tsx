/**
 * Section wrapper — rounded card with a tinted header strip, matching
 * the OTB dashboard cards' visual language. Used for every content card
 * on the Trend Intelligence page so they read as a family.
 */

import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

interface Props {
  title: string;
  icon: LucideIcon;
  right?: ReactNode;
  children: ReactNode;
}

export function SectionCard({ title, icon: Icon, right, children }: Props) {
  return (
    <section
      className="flex flex-col rounded-xl border bg-white"
      style={{ borderColor: 'var(--color-divider)' }}
    >
      <header
        className="flex items-center justify-between gap-2 rounded-t-xl border-b px-3 py-2"
        style={{
          borderColor: 'var(--color-divider)',
          background: 'linear-gradient(90deg, rgba(96,165,250,0.12), rgba(167,139,250,0.06))',
        }}
      >
        <div className="flex items-center gap-2">
          <span
            className="flex h-6 w-6 items-center justify-center rounded-md"
            style={{ background: 'rgba(96,165,250,0.14)', color: 'var(--color-primary)' }}
          >
            <Icon size={13} />
          </span>
          <h3
            className="text-[12px] font-semibold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {title}
          </h3>
        </div>
        {right}
      </header>

      <div className="flex-1 px-3 py-3">{children}</div>
    </section>
  );
}
