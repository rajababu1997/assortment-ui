/**
 * Pending Tasks — a buyer-action subset of WIP grouped by urgency.
 * Where the buyer spends most of their day.
 */

import { useNavigate } from 'react-router-dom';
import { CheckSquare, AlertCircle, Clock as ClockIcon, Circle } from 'lucide-react';
import type { PendingTask } from '../useDashboardSections';

interface Props {
  tasks: PendingTask[];
  isLoading: boolean;
}

const BUCKET_TONE: Record<PendingTask['bucket'], { bg: string; fg: string; icon: React.ReactNode }> = {
  overdue: { bg: 'rgba(239,68,68,0.12)', fg: '#b91c1c', icon: <AlertCircle size={12} /> },
  today: { bg: 'rgba(96,165,250,0.12)', fg: '#1d4ed8', icon: <ClockIcon size={12} /> },
  waiting: { bg: 'var(--color-surface-alt, #f1f5f9)', fg: 'var(--color-text-secondary)', icon: <Circle size={12} /> },
};

const BUCKET_LABEL: Record<PendingTask['bucket'], string> = {
  overdue: 'Overdue',
  today: 'Today',
  waiting: 'Waiting',
};

export function PendingTasks({ tasks, isLoading }: Props) {
  const navigate = useNavigate();
  return (
    <section
      className="rounded-xl border"
      style={{ background: 'var(--color-surface)', borderColor: 'var(--color-divider)' }}
    >
      <header
        className="flex items-center gap-2 rounded-t-xl border-b px-3 py-2"
        style={{
          borderColor: 'var(--color-divider)',
          background: 'linear-gradient(90deg, rgba(96,165,250,0.12), rgba(167,139,250,0.06))',
        }}
      >
        <span
          className="flex h-6 w-6 items-center justify-center rounded-md"
          style={{
            background: 'rgba(96,165,250,0.12)',
            color: 'var(--color-primary)',
          }}
        >
          <CheckSquare size={12} />
        </span>
        <h3
          className="text-[12px] font-semibold uppercase tracking-[0.10em]"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          My Pending Tasks
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
          : tasks.length === 0
          ? (
            <p className="px-3 py-3 text-center text-[11.5px] italic"
              style={{ color: 'var(--color-text-tertiary)' }}>
              No tasks waiting on you. Nice work.
            </p>
          )
          : tasks.map((t) => {
              const tone = BUCKET_TONE[t.bucket];
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => navigate(t.href)}
                  className="flex w-full items-center gap-3 border-b px-3 py-2 text-left transition-colors last:border-b-0 hover:bg-[var(--color-surface-alt,#f8fafc)]"
                  style={{ borderColor: 'var(--color-divider)' }}
                >
                  <span
                    className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase"
                    style={{ background: tone.bg, color: tone.fg }}
                  >
                    {tone.icon}
                    {BUCKET_LABEL[t.bucket]}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div
                      className="truncate text-[12px] font-medium"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      {t.title}
                    </div>
                    <div
                      className="truncate text-[10.5px]"
                      style={{ color: 'var(--color-text-tertiary)' }}
                    >
                      {t.subtitle}
                    </div>
                  </div>
                </button>
              );
            })}
      </div>
    </section>
  );
}
