/**
 * Dashboard — buyer's operational landing page.
 *
 * Layout:
 *   1. Header (planning year + buyer name)
 *   2. Filter bar
 *   3. Budget Snapshot (Annual / Released / Remaining + categories + approvals)
 *   4. KPI strip (4 quick-glance tiles)
 *   5. Planning Pipeline + OTB Status table (side-by-side)
 *   6. Release Timeline (12 months)
 *   7. Approval Status (3 cards)
 *   8. Category Progress
 *   9. Pipeline funnel + Aging chart (side-by-side)
 *  10. Current WIP + My Pending Tasks (side-by-side)
 *  11. Recent Activities
 *
 * Mounts at `/dashboard`.
 */

import { LayoutDashboard, RefreshCw } from 'lucide-react';
import { useIsFetching, useQueryClient } from '@tanstack/react-query';
import { useAppSelector } from '@/hooks/useAppSelector';
import { useDashboardFilters } from './useDashboardFilters';
import { useWipItems } from './useWipItems';
import { useDashboardKpis } from './useDashboardKpis';
import {
  useApprovalStatus,
  useCategoryProgress,
  useOtbBudgetSummary,
  usePendingTasks,
  usePlanningPipeline,
  useRecentActivities,
  useReleaseTimeline,
  useStatusBreakdown,
} from './useDashboardSections';
import { FilterBar } from './components/FilterBar';
import { WipQueue } from './components/WipQueue';
import { KpiStrip } from './components/KpiStrip';
import { PipelineFunnel } from './components/PipelineFunnel';
import { AgingChart } from './components/AgingChart';
import { BudgetSnapshot } from './components/BudgetSnapshot';
import { PlanningPipeline } from './components/PlanningPipeline';
import { StatusTable } from './components/StatusTable';
import { ReleaseTimeline } from './components/ReleaseTimeline';
import { ApprovalStatus } from './components/ApprovalStatus';
import { CategoryProgress } from './components/CategoryProgress';
import { PendingTasks } from './components/PendingTasks';
import { RecentActivities } from './components/RecentActivities';

export default function DashboardPage() {
  const user = useAppSelector((s) => s.auth.user);
  const buyerName = user?.firstName || user?.userName || 'Buyer';

  const queryClient = useQueryClient();
  const activeFetches = useIsFetching();
  const isRefreshing = activeFetches > 0;
  // Invalidate every query the dashboard reads from. Broad invalidation is
  // fine here — the buyer explicitly asked for fresh data.
  const refreshAll = () => {
    queryClient.invalidateQueries({ queryKey: ['otb'] });
    queryClient.invalidateQueries({ queryKey: ['sales'] });
  };

  const { filters, setFilters, reset } = useDashboardFilters();

  // Shared data hooks — each is independent but they cache through TanStack
  // Query, so duplicate work is deduped automatically.
  const wip = useWipItems(filters);
  const kpis = useDashboardKpis(filters);
  const budget = useOtbBudgetSummary(filters);
  const pipeline = usePlanningPipeline(filters);
  const status = useStatusBreakdown(filters);
  const timeline = useReleaseTimeline(filters);
  const approvals = useApprovalStatus(filters);
  const categoryProg = useCategoryProgress(filters);
  const tasks = usePendingTasks(filters);
  const activities = useRecentActivities(filters);

  const hasActiveFilters =
    filters.brands.length > 0 ||
    filters.categories.length > 0 ||
    !!filters.from ||
    !!filters.to;

  const headerSummary =
    wip.isLoading ? 'Loading…'
    : wip.totalCount === 0 ? 'Nothing pending'
    : `${wip.totalCount} item${wip.totalCount === 1 ? '' : 's'} need${wip.totalCount === 1 ? 's' : ''} attention`;

  return (
    <div className="flex h-full w-full flex-col p-1">
      <div
        className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border shadow-sm"
        style={{ background: 'var(--color-surface)', borderColor: 'var(--color-divider)' }}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div
          className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-2.5"
          style={{ borderColor: 'var(--color-divider)' }}
        >
          <div className="flex items-center gap-3">
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
              style={{
                background:
                  'linear-gradient(135deg, rgba(96,165,250,0.18), rgba(167,139,250,0.18))',
                border: '1px solid rgba(96,165,250,0.22)',
                color: 'var(--color-primary)',
              }}
            >
              <LayoutDashboard size={14} strokeWidth={2} />
            </span>
            <div className="min-w-0">
              <h1
                className="text-base font-semibold leading-tight"
                style={{ color: 'var(--color-text-primary)' }}
              >
                Assortment OTB Dashboard
              </h1>
              <p
                className="mt-0.5 text-xs"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                Planning Year {timeline.year} · Buyer: {buyerName} · {headerSummary}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={refreshAll}
            disabled={isRefreshing}
            title={isRefreshing ? 'Refreshing…' : 'Refresh dashboard data'}
            aria-label="Refresh dashboard"
            className="flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-[11.5px] font-medium transition-colors hover:bg-[var(--color-surface-alt,#f8fafc)] disabled:opacity-60"
            style={{
              borderColor: 'var(--color-divider)',
              color: 'var(--color-text-secondary)',
              background: 'var(--color-surface)',
            }}
          >
            <RefreshCw
              size={13}
              className={isRefreshing ? 'animate-spin' : ''}
            />
            {isRefreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>

        {/* ── Filter bar ─────────────────────────────────────────────────── */}
        <FilterBar
          filters={filters}
          setFilters={setFilters}
          reset={reset}
          hasActiveFilters={hasActiveFilters}
        />

        {/* ── Body ──────────────────────────────────────────────────────── */}
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
          {/* Snapshot row: budget breakdown */}
          <BudgetSnapshot data={budget.data} isLoading={budget.isLoading} />

          {/* 4 quick-glance tiles */}
          <KpiStrip snapshot={kpis.snapshot} isLoading={kpis.isLoading} />

          {/* Planning pipeline + OTB status table */}
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1.4fr_1fr]">
            <PlanningPipeline stages={pipeline.stages} isLoading={pipeline.isLoading} />
            <StatusTable rows={status.rows} isLoading={status.isLoading} />
          </div>

          {/* Release timeline */}
          <ReleaseTimeline
            months={timeline.months}
            year={timeline.year}
            isLoading={timeline.isLoading}
          />

          {/* Approval status — 3 cards */}
          <ApprovalStatus groups={approvals.groups} isLoading={approvals.isLoading} />

          {/* Category progress */}
          <CategoryProgress
            rows={categoryProg.rows}
            isLoading={categoryProg.isLoading}
            totalCategories={categoryProg.totalCategories}
            completed={categoryProg.completed}
            pending={categoryProg.pending}
          />

          {/* Funnel + aging side-by-side */}
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1.4fr_1fr]">
            <PipelineFunnel stages={kpis.funnel} isLoading={kpis.isLoading} />
            <AgingChart buckets={kpis.aging} isLoading={kpis.isLoading} />
          </div>

          {/* WIP + pending tasks side-by-side */}
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1.5fr_1fr]">
            <WipQueue
              result={wip}
              onResetFilters={reset}
              hasActiveFilters={hasActiveFilters}
            />
            <PendingTasks tasks={tasks.tasks} isLoading={tasks.isLoading} />
          </div>

          {/* Recent activities */}
          <RecentActivities items={activities.items} isLoading={activities.isLoading} />
        </div>
      </div>
    </div>
  );
}
