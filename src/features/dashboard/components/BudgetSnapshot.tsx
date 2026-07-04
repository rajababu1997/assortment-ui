/**
 * Budget Snapshot — the buyer's headline view of OTB consumption.
 * Total Annual OTB · Released · Remaining + utilization meter, plus
 * compact secondary tiles for category progress and approval counts.
 */

import { CircleDollarSign, Layers, ShieldCheck, Wallet } from 'lucide-react';
import type { OtbBudgetSummary } from '../useDashboardSections';

interface Props {
  data: OtbBudgetSummary;
  isLoading: boolean;
}

const fmtCr = (v: number) => `₹${Math.round(v).toLocaleString('en-IN')}`;

export function BudgetSnapshot({ data, isLoading }: Props) {
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
          <Wallet size={12} />
        </span>
        <h3
          className="text-[12px] font-semibold uppercase tracking-[0.10em]"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Budget Snapshot
        </h3>
      </header>

      <div className="grid grid-cols-1 gap-3 px-3 py-3 lg:grid-cols-[2fr_1fr_1fr]">
        {/* Budget cluster: Annual · Released · Remaining + bar */}
        <div
          className="rounded-lg border px-3 py-2.5"
          style={{
            background:
              'linear-gradient(180deg, rgba(96,165,250,0.18) 0%, var(--color-surface) 70%)',
            borderColor: 'rgba(96,165,250,0.32)',
          }}
        >
          <div
            className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.10em]"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            <CircleDollarSign size={11} /> OTB Budget
          </div>
          <div className="mt-1.5 flex flex-wrap items-baseline gap-3">
            <NumberBlock
              label="Annual"
              value={isLoading ? '—' : fmtCr(data.totalAnnual)}
              accent="primary"
            />
            <NumberBlock
              label="Released"
              value={isLoading ? '—' : fmtCr(data.released)}
              accent="success"
            />
            <NumberBlock
              label="Remaining"
              value={isLoading ? '—' : fmtCr(data.remaining)}
              accent="warning"
            />
          </div>
          <div
            className="mt-2 h-2 overflow-hidden rounded-full"
            style={{ background: 'var(--color-surface-alt, #f1f5f9)' }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.min(100, Math.max(0, data.utilizationPct * 100))}%`,
                background: 'linear-gradient(90deg, #22c55e, #60a5fa)',
              }}
            />
          </div>
          <div
            className="mt-1 text-right text-[10.5px] tabular-nums"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            {Math.round(data.utilizationPct * 100)}% utilized
          </div>
        </div>

        {/* Categories cluster */}
        <SecondaryGroup
          icon={<Layers size={11} />}
          label="Categories"
          tint="rgba(167,139,250,0.18)"
          borderTint="rgba(167,139,250,0.32)"
          tiles={[
            { label: 'Total', value: data.totalCategories, fg: 'var(--color-text-primary)' },
            { label: 'Done', value: data.completedCategories, fg: '#047857' },
            { label: 'Pending', value: data.pendingCategories, fg: '#b45309' },
          ]}
          isLoading={isLoading}
        />

        {/* Approvals cluster */}
        <SecondaryGroup
          icon={<ShieldCheck size={11} />}
          label="Approvals pending"
          tint="rgba(16,185,129,0.16)"
          borderTint="rgba(16,185,129,0.30)"
          tiles={[
            { label: 'Option', value: data.optionPlansPending, fg: '#1d4ed8' },
            { label: 'Design', value: data.designReviewPending, fg: '#6d28d9' },
            { label: 'Final', value: data.approvalPending, fg: '#047857' },
          ]}
          isLoading={isLoading}
        />
      </div>
    </section>
  );
}

function NumberBlock({
  label, value, accent,
}: {
  label: string;
  value: string;
  accent: 'primary' | 'success' | 'warning';
}) {
  const fg = accent === 'success' ? '#047857' : accent === 'warning' ? '#b45309' : 'var(--color-primary)';
  return (
    <div>
      <div
        className="text-[10px] font-semibold uppercase tracking-wider"
        style={{ color: 'var(--color-text-tertiary)' }}
      >
        {label}
      </div>
      <div
        className="text-lg font-bold tabular-nums leading-tight"
        style={{ color: fg }}
      >
        {value}
      </div>
    </div>
  );
}

function SecondaryGroup({
  icon, label, tiles, isLoading, tint, borderTint,
}: {
  icon: React.ReactNode;
  label: string;
  tiles: Array<{ label: string; value: number; fg: string }>;
  isLoading: boolean;
  tint: string;
  borderTint: string;
}) {
  return (
    <div
      className="rounded-lg border px-3 py-2.5"
      style={{
        background: `linear-gradient(180deg, ${tint} 0%, var(--color-surface) 70%)`,
        borderColor: borderTint,
      }}
    >
      <div
        className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.10em]"
        style={{ color: 'var(--color-text-tertiary)' }}
      >
        {icon} {label}
      </div>
      <div className="mt-1.5 grid grid-cols-3 gap-2">
        {tiles.map((t) => (
          <div key={t.label}>
            <div
              className="text-lg font-bold tabular-nums leading-tight"
              style={{ color: isLoading ? 'var(--color-text-tertiary)' : t.fg }}
            >
              {isLoading ? '—' : t.value}
            </div>
            <div
              className="text-[10px] uppercase tracking-wider"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              {t.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
