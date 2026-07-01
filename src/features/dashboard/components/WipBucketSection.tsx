/**
 * Collapsible bucket section — header with title + count, body lists
 * `<WipItemCard/>`s. Auto-collapsed when the bucket is empty.
 */

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { WipItemCard } from './WipItemCard';
import type { WipItem } from '../useWipItems';

interface Props {
  title: string;
  description?: string;
  items: WipItem[];
  tone: 'neutral' | 'info' | 'warning' | 'success';
}

const TONE_BG: Record<Props['tone'], string> = {
  neutral: 'var(--color-surface-alt, #f1f5f9)',
  info: 'rgba(96,165,250,0.10)',
  warning: 'rgba(245,158,11,0.12)',
  success: 'rgba(16,185,129,0.10)',
};

const TONE_FG: Record<Props['tone'], string> = {
  neutral: 'var(--color-text-secondary)',
  info: 'var(--color-primary)',
  warning: '#b45309',
  success: '#047857',
};

export function WipBucketSection({ title, description, items, tone }: Props) {
  const [open, setOpen] = useState(items.length > 0);
  const count = items.length;

  return (
    <section
      className="rounded-xl border"
      style={{
        borderColor: 'var(--color-divider)',
        background: 'var(--color-surface)',
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-[var(--color-surface-alt,#f8fafc)]"
      >
        <span
          className="flex h-6 min-w-[26px] items-center justify-center rounded-full px-2 text-[11px] font-bold tabular-nums"
          style={{
            background: TONE_BG[tone],
            color: TONE_FG[tone],
          }}
        >
          {count}
        </span>
        <div className="min-w-0 flex-1 leading-tight">
          <h2
            className="text-[13px] font-semibold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {title}
          </h2>
          {description && (
            <p
              className="mt-0.5 text-[11px]"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              {description}
            </p>
          )}
        </div>
        <span
          className="flex h-6 w-6 items-center justify-center rounded-md border"
          style={{
            borderColor: 'var(--color-divider)',
            color: 'var(--color-text-secondary)',
          }}
          aria-hidden
        >
          {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </span>
      </button>

      {open && (
        <div
          className="flex flex-col gap-1.5 border-t px-3 py-3"
          style={{ borderColor: 'var(--color-divider)' }}
        >
          {count === 0 ? (
            <p
              className="px-1 py-1 text-[11px] italic"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              Nothing here.
            </p>
          ) : (
            items.map((item) => <WipItemCard key={item.key} item={item} />)
          )}
        </div>
      )}
    </section>
  );
}
