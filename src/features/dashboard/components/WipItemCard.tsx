/**
 * One row in the WIP queue — plan type icon + title + subtitle + age +
 * primary action button. Stuck items (> 3 days idle) get an amber flag.
 */

import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  CalendarDays,
  ChevronRight,
  Layers,
  PackageCheck,
  type LucideIcon,
} from 'lucide-react';
import type { WipItem } from '../useWipItems';
import type { PlanType } from '../useDashboardFilters';

const PLAN_TYPE_ICON: Record<PlanType, LucideIcon> = {
  annual: CalendarDays,
  value: Layers,
  option: PackageCheck,
};

const PLAN_TYPE_LABEL: Record<PlanType, string> = {
  annual: 'Annual',
  value: 'Value',
  option: 'Option',
};

export function WipItemCard({ item }: { item: WipItem }) {
  const navigate = useNavigate();
  const Icon = PLAN_TYPE_ICON[item.planType];

  return (
    <button
      type="button"
      onClick={() => navigate(item.href)}
      className="group flex w-full items-center gap-2.5 rounded-md border px-2.5 py-1.5 text-left transition-colors hover:border-[var(--color-primary)]"
      style={{
        borderColor: 'var(--color-divider)',
        background: 'var(--color-surface)',
      }}
    >
      {/* Plan type icon chip */}
      <span
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded"
        style={{
          background: 'color-mix(in srgb, var(--color-primary) 10%, transparent)',
          color: 'var(--color-primary)',
        }}
        aria-hidden
      >
        <Icon size={12} />
      </span>

      {/* Title + subtitle */}
      <div className="min-w-0 flex-1 leading-tight">
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className="truncate text-[12.5px] font-semibold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {item.title}
          </span>
          <span
            className="rounded-full px-1.5 py-px text-[9.5px] font-semibold uppercase tracking-wider"
            style={{
              background: 'var(--color-surface-alt, #f1f5f9)',
              color: 'var(--color-text-tertiary)',
            }}
          >
            {PLAN_TYPE_LABEL[item.planType]}
          </span>
          {item.isStuck && (
            <span
              className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-px text-[9.5px] font-semibold"
              style={{
                background: 'rgba(245,158,11,0.16)',
                color: '#b45309',
              }}
              title="Stuck for more than 3 days"
            >
              <AlertTriangle size={9} /> Stuck
            </span>
          )}
        </div>
        {item.subtitle && (
          <div
            className="mt-0.5 truncate text-[11px]"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            {item.subtitle}
          </div>
        )}
      </div>

      {/* Age */}
      <span
        className="shrink-0 text-[10.5px] tabular-nums"
        style={{ color: 'var(--color-text-tertiary)' }}
      >
        {item.ageLabel}
      </span>

      {/* Action label */}
      <span
        className="flex shrink-0 items-center gap-0.5 rounded px-1.5 py-0.5 text-[10.5px] font-medium transition-colors"
        style={{
          color: 'var(--color-primary)',
        }}
      >
        {item.actionLabel}
        <ChevronRight size={11} />
      </span>
    </button>
  );
}
