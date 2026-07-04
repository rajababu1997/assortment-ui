/**
 * Right-side drawer that explains why the engine recommended what it did.
 * Reads structured drivers + caveats from the explanation payload — same
 * shape regardless of which recommender it came from.
 */

import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import type { RecommendationExplanation } from '../types';

export interface SectionedExplanation {
  /** Used as the card header (e.g. "October 2026 · OTB-…", "Core band", "Cotton 100%"). */
  title: string;
  /** Optional second line (e.g. ₹13.2 Cr · 11% of plan). */
  subtitle?: string;
  explanation: RecommendationExplanation;
  /**
   * Optional rich card body. When present, replaces the default drivers list
   * with plan-type-specific UI (Annual YoY card, VP LY/TY/Reasons card, etc.).
   * Header + caveats still render around it uniformly.
   */
  richContent?: ReactNode;
  /**
   * Optional rich card header. When present, replaces the default
   * title/subtitle stack — the caller renders whatever it wants (badges,
   * multi-line bold text, etc.).
   */
  headerNode?: ReactNode;
}

export function ExplanationDrawer({
  open,
  onClose,
  title,
  overall,
  sections,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  overall?: RecommendationExplanation;
  sections: SectionedExplanation[];
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      style={{ background: 'rgba(15,23,42,0.35)' }}
      onClick={onClose}
    >
      <aside
        className="flex h-full w-[min(560px,92vw)] flex-col overflow-hidden border-l shadow-2xl"
        style={{ background: 'var(--color-surface)', borderColor: 'var(--color-divider)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <header
          className="flex items-center justify-between border-b px-4 py-3"
          style={{ borderColor: 'var(--color-divider)' }}
        >
          <h2 className="min-w-0 truncate text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-[var(--color-surface-alt,#f1f5f9)]"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <X size={16} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          <div className="flex flex-col gap-3">
            {sections.map((s, i) => (
              <SectionCard key={`${s.title}-${i}`} section={s} />
            ))}
          </div>

          {overall?.caveats?.length ? (
            <div className="mt-4 rounded-lg border px-3 py-2 text-xs"
              style={{
                borderColor: 'rgba(245,158,11,0.35)',
                background: 'rgba(254,243,199,0.6)',
                color: '#92400e',
              }}>
              <div className="font-semibold uppercase tracking-wider" style={{ fontSize: 10 }}>Caveats</div>
              {overall.caveats.map((c) => <div key={c}>· {c}</div>)}
            </div>
          ) : null}
        </div>
      </aside>
    </div>
  );
}

function SectionCard({ section }: { section: SectionedExplanation }) {
  const { title, subtitle, explanation, richContent, headerNode } = section;
  return (
    <section
      className="rounded-lg border"
      style={{ borderColor: 'var(--color-divider)' }}
    >
      <header className="flex items-center justify-between gap-2 px-3 py-2.5">
        {headerNode ? (
          <div className="min-w-0 flex-1">{headerNode}</div>
        ) : (
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              {title}
            </div>
            {subtitle && (
              <div className="mt-0.5 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                {subtitle}
              </div>
            )}
          </div>
        )}
      </header>
      {richContent ? (
        <div className="border-t" style={{ borderColor: 'var(--color-divider)' }}>
          {richContent}
        </div>
      ) : (
        <>
          {explanation.summary && (
            <p className="px-3 pb-2 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              {explanation.summary}
            </p>
          )}
          {explanation.drivers.length > 0 && (
            <ul className="border-t" style={{ borderColor: 'var(--color-divider)' }}>
              {explanation.drivers.map((d, idx) => (
                <li
                  key={`${d.label}-${idx}`}
                  className="border-b px-3 py-1.5 text-xs last:border-b-0"
                  style={{ borderColor: 'var(--color-divider)' }}
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium" style={{ color: 'var(--color-text-primary)' }}>
                      {d.label}
                    </div>
                    <div className="truncate" style={{ color: 'var(--color-text-tertiary)' }}>
                      {d.observation}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
