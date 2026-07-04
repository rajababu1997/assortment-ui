/**
 * Signal card — the core visual atom. Deliberately split into TWO rails:
 *
 *   1. SOURCE FACTS  — event name, date, region, external source link.
 *      Nothing here is analyst-generated.
 *   2. MERCHANDISER GUIDANCE — analyst's planning recommendation. Clearly
 *      labelled so nobody mistakes it for a source-published prediction.
 *
 * The visual separator between the two rails is intentional — customers
 * should be able to tell at a glance which numbers came from Marvel/GoI
 * and which came from our team.
 */

import { CalendarDays, ExternalLink, Info, MapPin } from 'lucide-react';
import type { Signal } from '../types';
import {
  ACTION_LABEL,
  ACTION_TONE,
  CATEGORY_LABEL,
  CATEGORY_TONE,
  CONFIDENCE_LABEL,
  CONFIDENCE_TONE,
  fmtRegion,
  fmtWhen,
} from '../utils';

interface Props {
  signal: Signal;
}

export function SignalCard({ signal }: Props) {
  const catTone = CATEGORY_TONE[signal.signalCategory];
  const confTone = CONFIDENCE_TONE[signal.dateConfidence];
  const actionKey = signal.planningRelevance.action;
  const actionTone = ACTION_TONE[actionKey] ?? ACTION_TONE.WATCH;

  return (
    <article
      className="flex flex-col overflow-hidden rounded-xl border bg-white"
      style={{ borderColor: 'var(--color-divider)' }}
    >
      {/* ── Source rail ──────────────────────────────────────────────── */}
      <header
        className="flex flex-col gap-2 border-b px-4 py-3"
        style={{
          borderColor: 'var(--color-divider)',
          background: 'linear-gradient(90deg, rgba(96,165,250,0.10), rgba(167,139,250,0.04))',
        }}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <CalendarDays size={13} style={{ color: 'var(--color-primary)' }} />
              <h3
                className="truncate text-[13px] font-semibold leading-tight"
                style={{ color: 'var(--color-text-primary)' }}
                title={signal.title}
              >
                {signal.title}
              </h3>
            </div>
            <div
              className="mt-1 text-[11.5px] tabular-nums"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {fmtWhen(signal)}
            </div>
          </div>

          <span
            className="shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em]"
            style={{
              background: 'color-mix(in srgb, var(--color-primary) 12%, transparent)',
              color: 'var(--color-primary)',
            }}
            title="This block is source-backed fact"
          >
            Source
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1">
          <Pill bg={catTone.bg} fg={catTone.fg} border={catTone.border}>
            {CATEGORY_LABEL[signal.signalCategory]}
          </Pill>
          <Pill bg={confTone.bg} fg={confTone.fg} border={confTone.fg + '55'}>
            {CONFIDENCE_LABEL[signal.dateConfidence]}
          </Pill>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <MapPin size={10} style={{ color: 'var(--color-text-tertiary)' }} />
          {signal.coverageRegions.map((r) => (
            <span
              key={r}
              className="rounded-md border px-1.5 py-0.5 text-[10px]"
              style={{
                borderColor: 'var(--color-divider)',
                color: 'var(--color-text-secondary)',
                background: 'var(--color-surface)',
              }}
            >
              {fmtRegion(r)}
            </span>
          ))}
        </div>

        <div className="flex items-start gap-1.5 text-[11px]"
          style={{ color: 'var(--color-text-tertiary)' }}>
          <Info size={11} className="mt-[2px] shrink-0" />
          <div className="min-w-0">
            <span style={{ color: 'var(--color-text-secondary)' }}>Source:</span>{' '}
            {signal.sourceCitation.url ? (
              <a
                href={signal.sourceCitation.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-0.5 hover:underline"
                style={{ color: 'var(--color-primary)' }}
              >
                {signal.sourceCitation.name}
                <ExternalLink size={9} />
              </a>
            ) : (
              <span>{signal.sourceCitation.name}</span>
            )}
            {signal.sourceCitation.note && (
              <div className="mt-0.5 italic">{signal.sourceCitation.note}</div>
            )}
          </div>
        </div>
      </header>

      {/* ── Analyst rail ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2 px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <span
            className="text-[9px] font-bold uppercase tracking-[0.14em]"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            Merchandiser guidance
          </span>
          <Pill bg={actionTone.bg} fg={actionTone.fg} border={actionTone.fg + '55'}>
            {ACTION_LABEL[actionKey] ?? actionKey}
          </Pill>
        </div>

        <div>
          <div
            className="text-[10.5px] font-semibold uppercase tracking-wider"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            Primary category
          </div>
          <div
            className="mt-0.5 text-[13px] font-semibold leading-tight"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {signal.planningRelevance.primaryCategory}
          </div>
          {signal.planningRelevance.secondaryCategories && signal.planningRelevance.secondaryCategories.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {signal.planningRelevance.secondaryCategories.map((c) => (
                <span
                  key={c}
                  className="rounded-md border px-1.5 py-0.5 text-[10px]"
                  style={{
                    borderColor: 'var(--color-divider)',
                    color: 'var(--color-text-secondary)',
                    background: 'var(--color-surface-alt, #f8fafc)',
                  }}
                >
                  {c}
                </span>
              ))}
            </div>
          )}
        </div>

        <p
          className="text-[11.5px] leading-relaxed"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {signal.planningRelevance.reasoning}
        </p>
      </div>
    </article>
  );
}

function Pill({
  children, bg, fg, border,
}: {
  children: React.ReactNode; bg: string; fg: string; border: string;
}) {
  return (
    <span
      className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10.5px] font-semibold"
      style={{ background: bg, color: fg, borderColor: border }}
    >
      {children}
    </span>
  );
}
