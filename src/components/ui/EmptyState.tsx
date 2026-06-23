import type { ReactNode } from 'react';

interface EmptyStateProps {
  /** PrimeIcon class name (e.g. 'pi-sitemap') */
  icon: string;
  /** Primary message */
  title: string;
  /** Secondary description */
  description?: string;
  /** Optional CTA button */
  action?: ReactNode;
}

/**
 * Shared empty state — used when a page/section has no data.
 * Features animated geometric shapes, gradient icon pill, and AI-themed styling.
 */
export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center py-20 rounded-xl border h-full relative overflow-hidden"
      style={{ backgroundColor: 'var(--surface-card)', borderColor: 'var(--surface-border)' }}
    >
      {/* Animated background shapes */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute w-64 h-64 rounded-full opacity-[0.03]"
          style={{
            background: 'radial-gradient(circle, var(--color-primary) 0%, transparent 70%)',
            top: '-30%',
            right: '-10%',
            animation: 'float-slow 8s ease-in-out infinite',
          }}
        />
        <div
          className="absolute w-48 h-48 rounded-full opacity-[0.03]"
          style={{
            background: 'radial-gradient(circle, var(--color-purple) 0%, transparent 70%)',
            bottom: '-20%',
            left: '-5%',
            animation: 'float-slow 10s ease-in-out infinite reverse',
          }}
        />
        {/* Geometric dots grid */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="empty-dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill="var(--color-text)" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#empty-dots)" />
        </svg>
      </div>

      {/* Icon pill with gradient */}
      <div className="relative">
        <div
          className="flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-sm"
          style={{
            background: 'linear-gradient(135deg, var(--color-primary-100), var(--color-purple-100))',
          }}
        >
          <i className={`pi ${icon} text-3xl`} style={{ color: 'var(--color-primary)' }} />
        </div>
      </div>

      <p className="text-sm font-semibold text-[var(--color-text)] mb-1 relative">{title}</p>
      {description && (
        <p className="text-xs text-[var(--color-text-secondary)] max-w-[360px] text-center leading-relaxed relative">
          {description}
        </p>
      )}
      {action && <div className="mt-4 relative">{action}</div>}
    </div>
  );
}
