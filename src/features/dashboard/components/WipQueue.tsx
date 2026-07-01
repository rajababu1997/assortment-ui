/**
 * Top-level WIP queue. Renders the 4 bucket sections + handles the
 * empty/loading/error states.
 */

import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Inbox, RefreshCw } from 'lucide-react';
import { WipBucketSection } from './WipBucketSection';
import type { UseWipItemsResult } from '../useWipItems';

interface Props {
  result: UseWipItemsResult;
  /** Called when the user clicks "Reset filters" in the "no matches" state. */
  onResetFilters: () => void;
  /** True when at least one filter (other than the default `myPlansOnly`) is active. */
  hasActiveFilters: boolean;
}

export function WipQueue({ result, onResetFilters, hasActiveFilters }: Props) {
  const navigate = useNavigate();

  if (result.isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-16 animate-pulse rounded-xl border"
            style={{
              background: 'var(--color-surface-alt, #f1f5f9)',
              borderColor: 'var(--color-divider)',
            }}
          />
        ))}
      </div>
    );
  }

  if (result.isError) {
    return (
      <EmptyState
        icon={<RefreshCw size={28} />}
        title="Couldn't load WIP items"
        body="Something went wrong fetching plan data. Refresh to try again."
      />
    );
  }

  if (result.noPlansAtAll) {
    return (
      <EmptyState
        icon={<Inbox size={28} />}
        title="No plans yet"
        body="Create your first Annual Plan to get started."
        ctaLabel="Go to OTB Planning"
        onCta={() => navigate('/otb')}
      />
    );
  }

  if (result.totalCount === 0) {
    if (hasActiveFilters) {
      return (
        <EmptyState
          icon={<Inbox size={28} />}
          title="No items match the current filters"
          body="Loosen the filters to see more."
          ctaLabel="Reset filters"
          onCta={onResetFilters}
        />
      );
    }
    return (
      <EmptyState
        icon={<CheckCircle2 size={28} />}
        title="All caught up"
        body="Nothing needs your attention right now. Nice work."
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <WipBucketSection
        title="Your drafts"
        description="Plans you're actively building. Continue where you left off."
        tone="info"
        items={result.buckets.drafts}
      />
      <WipBucketSection
        title="Awaiting review"
        description="Submitted — waiting for a reviewer to act."
        tone="neutral"
        items={result.buckets.review}
      />
      <WipBucketSection
        title="Revisions needed"
        description="Reviewer asked for changes. Address the comments to resubmit."
        tone="warning"
        items={result.buckets.revisions}
      />
      <WipBucketSection
        title="Ready to release"
        description="All approvals in. Release to lock the plan."
        tone="success"
        items={result.buckets.ready}
      />
    </div>
  );
}

function EmptyState({
  icon,
  title,
  body,
  ctaLabel,
  onCta,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  ctaLabel?: string;
  onCta?: () => void;
}) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-2 rounded-xl border px-6 py-12 text-center"
      style={{
        borderColor: 'var(--color-divider)',
        background: 'var(--color-surface)',
      }}
    >
      <span
        className="flex h-12 w-12 items-center justify-center rounded-full"
        style={{
          background: 'var(--color-surface-alt, #f1f5f9)',
          color: 'var(--color-text-tertiary)',
        }}
      >
        {icon}
      </span>
      <h3
        className="text-sm font-semibold"
        style={{ color: 'var(--color-text-primary)' }}
      >
        {title}
      </h3>
      <p
        className="max-w-md text-[12px]"
        style={{ color: 'var(--color-text-tertiary)' }}
      >
        {body}
      </p>
      {ctaLabel && onCta && (
        <button
          type="button"
          onClick={onCta}
          className="mt-1 rounded-md border px-3 py-1.5 text-[11.5px] font-medium"
          style={{
            borderColor: 'var(--color-divider)',
            color: 'var(--color-primary)',
            background: 'var(--color-surface)',
          }}
        >
          {ctaLabel}
        </button>
      )}
    </div>
  );
}
