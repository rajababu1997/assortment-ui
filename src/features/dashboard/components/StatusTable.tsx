/**
 * OTB Status Table — counts of OTB rows currently in each lifecycle
 * state, plus the workflow-blocking states (VP pending, OP pending,
 * revisions). Lets the buyer see the breakdown at a glance.
 */

import { Table2 } from 'lucide-react';
import type { StatusRow } from '../useDashboardSections';

interface Props {
  rows: StatusRow[];
  isLoading: boolean;
}

const TONE_BG: Record<StatusRow['tone'], string> = {
  neutral: 'var(--color-surface-alt, #f1f5f9)',
  info: 'rgba(96,165,250,0.10)',
  warning: 'rgba(245,158,11,0.12)',
  success: 'rgba(16,185,129,0.10)',
  danger: 'rgba(239,68,68,0.10)',
};

const TONE_FG: Record<StatusRow['tone'], string> = {
  neutral: 'var(--color-text-secondary)',
  info: '#1d4ed8',
  warning: '#b45309',
  success: '#047857',
  danger: '#b91c1c',
};

export function StatusTable({ rows, isLoading }: Props) {
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
          <Table2 size={12} />
        </span>
        <h3
          className="text-[12px] font-semibold uppercase tracking-[0.10em]"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          OTB Status Breakdown
        </h3>
      </header>

      <div className="overflow-hidden">
        <table className="w-full text-[12px]">
          <thead>
            <tr style={{ background: 'var(--color-surface-alt, #f8fafc)' }}>
              <th
                className="px-3 py-1.5 text-left text-[10px] font-semibold uppercase tracking-[0.10em]"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                State
              </th>
              <th
                className="px-3 py-1.5 text-right text-[10px] font-semibold uppercase tracking-[0.10em]"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                Count
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={2} className="px-3 py-1.5">
                      <div
                        className="h-4 animate-pulse rounded"
                        style={{ background: 'var(--color-surface-alt, #f1f5f9)' }}
                      />
                    </td>
                  </tr>
                ))
              : rows.map((r) => (
                  <tr
                    key={String(r.state)}
                    className="border-t"
                    style={{ borderColor: 'var(--color-divider)' }}
                  >
                    <td className="px-3 py-1.5">
                      <span
                        className="inline-flex rounded-full px-2 py-px text-[10.5px] font-semibold"
                        style={{ background: TONE_BG[r.tone], color: TONE_FG[r.tone] }}
                      >
                        {r.label}
                      </span>
                    </td>
                    <td
                      className="px-3 py-1.5 text-right tabular-nums"
                      style={{
                        color: r.count > 0
                          ? 'var(--color-text-primary)'
                          : 'var(--color-text-tertiary)',
                      }}
                    >
                      {r.count}
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
