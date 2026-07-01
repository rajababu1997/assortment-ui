/**
 * Recent Activities — chronological list of plan state changes derived
 * from approval timestamps on OTB rows.
 */

import { useNavigate } from 'react-router-dom';
import { Activity, ChevronRight } from 'lucide-react';
import type { ActivityItem } from '../useDashboardSections';

interface Props {
  items: ActivityItem[];
  isLoading: boolean;
}

const ROLE_LABEL: Record<ActivityItem['actorRole'], string> = {
  buyer: 'Buyer',
  designer: 'Designer',
  admin: 'Category Head',
  system: 'System',
};

const ROLE_TONE: Record<ActivityItem['actorRole'], { bg: string; fg: string }> = {
  buyer: { bg: 'rgba(96,165,250,0.12)', fg: '#1d4ed8' },
  designer: { bg: 'rgba(167,139,250,0.16)', fg: '#6d28d9' },
  admin: { bg: 'rgba(16,185,129,0.12)', fg: '#047857' },
  system: { bg: 'var(--color-surface-alt, #f1f5f9)', fg: 'var(--color-text-secondary)' },
};

export function RecentActivities({ items, isLoading }: Props) {
  const navigate = useNavigate();
  return (
    <section
      className="rounded-xl border"
      style={{ background: 'var(--color-surface)', borderColor: 'var(--color-divider)' }}
    >
      <header
        className="flex items-center gap-2 border-b px-3 py-2"
        style={{ borderColor: 'var(--color-divider)' }}
      >
        <span
          className="flex h-6 w-6 items-center justify-center rounded-md"
          style={{
            background: 'rgba(96,165,250,0.12)',
            color: 'var(--color-primary)',
          }}
        >
          <Activity size={12} />
        </span>
        <h3
          className="text-[12px] font-semibold uppercase tracking-[0.10em]"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Recent Activities
        </h3>
      </header>

      <div className="flex flex-col">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-12 animate-pulse border-b last:border-b-0"
                style={{
                  background: 'var(--color-surface-alt, #f1f5f9)',
                  borderColor: 'var(--color-divider)',
                }}
              />
            ))
          : items.length === 0
          ? (
            <p className="px-3 py-3 text-center text-[11.5px] italic"
              style={{ color: 'var(--color-text-tertiary)' }}>
              No activity yet.
            </p>
          )
          : items.map((it) => {
              const tone = ROLE_TONE[it.actorRole];
              return (
                <button
                  key={it.key}
                  type="button"
                  onClick={() => navigate(it.href)}
                  className="flex w-full items-center gap-2.5 border-b px-3 py-2 text-left transition-colors last:border-b-0 hover:bg-[var(--color-surface-alt,#f8fafc)]"
                  style={{ borderColor: 'var(--color-divider)' }}
                >
                  <span
                    className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                    style={{ background: tone.bg, color: tone.fg }}
                  >
                    {ROLE_LABEL[it.actorRole]}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div
                      className="truncate text-[12px]"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      <span className="font-semibold">{it.action}</span>
                      <span className="ml-1.5"
                        style={{ color: 'var(--color-text-tertiary)' }}>
                        — {it.subject}
                      </span>
                    </div>
                    <div className="text-[10.5px] tabular-nums"
                      style={{ color: 'var(--color-text-tertiary)' }}>
                      {it.whenLabel}
                    </div>
                  </div>
                  <ChevronRight size={12} style={{ color: 'var(--color-text-tertiary)' }} />
                </button>
              );
            })}
      </div>
    </section>
  );
}
