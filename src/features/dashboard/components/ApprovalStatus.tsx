/**
 * Approval Status — cards showing what's stuck waiting on which actor.
 * Reads from `useApprovalStatus` so it shares data with the pipeline.
 */

import { ShieldCheck, UserCheck, RotateCcw } from 'lucide-react';
import type { ApprovalGroup } from '../useDashboardSections';

interface Props {
  groups: ApprovalGroup[];
  isLoading: boolean;
}

const GROUP_ICON: Record<ApprovalGroup['key'], React.ReactNode> = {
  design_review: <UserCheck size={13} />,
  category_head: <ShieldCheck size={13} />,
  returned: <RotateCcw size={13} />,
};

const GROUP_TONE: Record<ApprovalGroup['key'], { bg: string; fg: string }> = {
  design_review: { bg: 'rgba(96,165,250,0.12)', fg: '#1d4ed8' },
  category_head: { bg: 'rgba(16,185,129,0.12)', fg: '#047857' },
  returned: { bg: 'rgba(239,68,68,0.12)', fg: '#b91c1c' },
};

export function ApprovalStatus({ groups, isLoading }: Props) {
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
          <ShieldCheck size={12} />
        </span>
        <h3
          className="text-[12px] font-semibold uppercase tracking-[0.10em]"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Approval Status
        </h3>
      </header>

      <div className="grid grid-cols-1 gap-2 px-3 py-3 sm:grid-cols-3">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-20 animate-pulse rounded-lg border"
                style={{
                  background: 'var(--color-surface-alt, #f1f5f9)',
                  borderColor: 'var(--color-divider)',
                }}
              />
            ))
          : groups.map((g) => {
              const tone = GROUP_TONE[g.key];
              return (
                <div
                  key={g.key}
                  className="rounded-lg border px-3 py-2"
                  style={{
                    background: 'var(--color-surface)',
                    borderColor: 'var(--color-divider)',
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="flex h-7 w-7 items-center justify-center rounded-md"
                      style={{ background: tone.bg, color: tone.fg }}
                    >
                      {GROUP_ICON[g.key]}
                    </span>
                    <div
                      className="text-[11.5px] font-semibold uppercase tracking-wider"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      {g.label}
                    </div>
                  </div>
                  <div
                    className="mt-1.5 text-2xl font-bold tabular-nums"
                    style={{ color: tone.fg }}
                  >
                    {g.count}
                  </div>
                  <div
                    className="mt-0.5 text-[10.5px]"
                    style={{ color: 'var(--color-text-tertiary)' }}
                  >
                    {g.description}
                  </div>
                </div>
              );
            })}
      </div>
    </section>
  );
}
