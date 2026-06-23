/**
 * FashionCalendar — generic year-at-a-glance calendar built for retail
 * planning. Two interchangeable views:
 *
 *   • Timeline (default) — Gantt-style. Category rows × 12 month columns.
 *     Best for spotting overlapping windows (sales × marriage × season).
 *
 *   • Grid — one card per month with an event list. Better for drill-down
 *     into a single month's calendar.
 *
 * Data flow: FashionCalendar → useCalendarEvents → calendarApi.ts (mock
 * today, real REST tomorrow). Pass `events` to override (tests/stories).
 */

import { useMemo, useState } from 'react';
import {
  AlertCircle,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  CloudSun,
  Flag,
  GraduationCap,
  Heart,
  LayoutGrid,
  Loader2,
  RefreshCw,
  Shirt,
  Sparkles,
  Tag,
  type LucideIcon,
} from 'lucide-react';
import { Select } from '@/components/primitives';
import type { CalendarEvent, CalendarEventCategory } from './types';
import { useCalendarEvents } from './useCalendarEvents';
import { SUPPORTED_COUNTRIES, type CalendarCountry } from './calendarApi';

interface Props {
  /** Default = current year. */
  year?: number;
  /** Default country. */
  country?: CalendarCountry;
  /** Override the API-fetched events (e.g., tests / Storybook). Skips fetch. */
  events?: CalendarEvent[];
  /** ISO YYYY-MM-DD to highlight (the demo "today"). */
  highlightDate?: string;
  /** 'timeline' (default) or 'grid'. */
  defaultView?: CalendarView;
}

type CalendarView = 'timeline' | 'grid';

interface CategoryStyle {
  color: string;
  bg: string;
  border: string;
  icon: LucideIcon;
  label: string;
}

const CATEGORY_STYLES: Record<CalendarEventCategory, CategoryStyle> = {
  festival: { color: '#b45309', bg: 'rgba(245,158,11,0.14)', border: 'rgba(245,158,11,0.40)', icon: Sparkles,       label: 'Major Festivals'  },
  sale:     { color: '#b91c1c', bg: 'rgba(239,68,68,0.14)',  border: 'rgba(239,68,68,0.40)',  icon: Tag,            label: 'Sales / EOSS'     },
  marriage: { color: '#be185d', bg: 'rgba(236,72,153,0.14)', border: 'rgba(236,72,153,0.40)', icon: Heart,          label: 'Wedding Season'   },
  season:   { color: '#0369a1', bg: 'rgba(14,165,233,0.14)', border: 'rgba(14,165,233,0.40)', icon: CloudSun,       label: 'Climate / Seasons'},
  brand:    { color: '#6d28d9', bg: 'rgba(167,139,250,0.14)', border: 'rgba(167,139,250,0.40)', icon: Shirt,        label: 'Brand Launches'   },
  school:   { color: '#047857', bg: 'rgba(16,185,129,0.14)', border: 'rgba(16,185,129,0.40)', icon: GraduationCap,  label: 'Back to School'   },
  national: { color: '#4338ca', bg: 'rgba(99,102,241,0.14)', border: 'rgba(99,102,241,0.40)', icon: Flag,           label: 'National Days'    },
};

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_LONG  = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const CATEGORY_ORDER: CalendarEventCategory[] = ['festival', 'sale', 'marriage', 'season', 'brand', 'school', 'national'];

export function FashionCalendar({
  year: initialYear,
  country: initialCountry = 'IN',
  events: overrideEvents,
  highlightDate,
  defaultView = 'timeline',
}: Props) {
  const [activeYear, setActiveYear] = useState(initialYear ?? new Date().getFullYear());
  const [activeCountry, setActiveCountry] = useState<CalendarCountry>(initialCountry);
  const [activeCategories, setActiveCategories] = useState<Set<CalendarEventCategory>>(
    () => new Set(CATEGORY_ORDER),
  );
  const [view, setView] = useState<CalendarView>(defaultView);

  const query = useCalendarEvents({ country: activeCountry, year: activeYear });
  const isLive = !overrideEvents;
  const events = overrideEvents ?? query.data ?? [];
  const isLoading = isLive && query.isLoading;
  const error = isLive ? query.error : null;

  const visibleEvents = useMemo(
    () => events.filter((e) => activeCategories.has(e.category)),
    [events, activeCategories],
  );

  const highlightInfo = useMemo(() => {
    if (!highlightDate) return null;
    const d = new Date(highlightDate);
    if (d.getFullYear() !== activeYear) return null;
    return { month: d.getMonth(), day: d.getDate() };
  }, [highlightDate, activeYear]);

  const toggleCategory = (cat: CalendarEventCategory) => {
    setActiveCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-3">
      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div
        className="flex flex-wrap items-center justify-between gap-3 rounded-xl border px-3 py-2.5"
        style={{
          background: 'var(--color-surface-alt, #f8fafc)',
          borderColor: 'var(--color-divider)',
        }}
      >
        <div className="flex flex-wrap items-center gap-3">
          {/* Year navigator */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveYear((y) => y - 1)}
              className="flex h-7 w-7 items-center justify-center rounded-md border bg-[var(--color-surface)] transition-colors hover:bg-[var(--color-surface-alt,#f1f5f9)]"
              style={{ borderColor: 'var(--color-divider)' }}
              aria-label="Previous year"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="min-w-[56px] text-center text-sm font-semibold tabular-nums" style={{ color: 'var(--color-text-primary)' }}>
              {activeYear}
            </span>
            <button
              type="button"
              onClick={() => setActiveYear((y) => y + 1)}
              className="flex h-7 w-7 items-center justify-center rounded-md border bg-[var(--color-surface)] transition-colors hover:bg-[var(--color-surface-alt,#f1f5f9)]"
              style={{ borderColor: 'var(--color-divider)' }}
              aria-label="Next year"
            >
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Country picker — dropdown */}
          <div className="min-w-[180px]">
            <Select<CalendarCountry>
              value={activeCountry}
              onChange={(v) => setActiveCountry(v)}
              options={SUPPORTED_COUNTRIES.map((c) => ({
                value: c.code,
                label: `${c.flag}  ${c.label}`,
              }))}
            />
          </div>

          {/* View switcher */}
          <div className="flex items-center gap-1 rounded-md border p-0.5" style={{ borderColor: 'var(--color-divider)', background: 'var(--color-surface)' }}>
            <ViewToggle icon={CalendarRange} label="Timeline" active={view === 'timeline'} onClick={() => setView('timeline')} />
            <ViewToggle icon={LayoutGrid}    label="Grid"     active={view === 'grid'}     onClick={() => setView('grid')} />
          </div>

          <span className="text-[11px]" style={{ color: 'var(--color-text-tertiary)' }}>
            {visibleEvents.length} event{visibleEvents.length === 1 ? '' : 's'}
          </span>
        </div>

        {/* Category filter chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          {CATEGORY_ORDER.map((cat) => {
            const style = CATEGORY_STYLES[cat];
            const Icon = style.icon;
            const on = activeCategories.has(cat);
            return (
              <button
                key={cat}
                type="button"
                onClick={() => toggleCategory(cat)}
                className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium transition-all"
                style={{
                  background: on ? style.bg : 'var(--color-surface)',
                  borderColor: on ? style.border : 'var(--color-divider)',
                  color: on ? style.color : 'var(--color-text-tertiary)',
                  opacity: on ? 1 : 0.7,
                }}
              >
                <Icon size={11} strokeWidth={2} />
                {style.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Error / loading / content ───────────────────────────────────── */}
      {error && <ErrorBanner error={error} onRetry={() => query.refetch()} />}
      {isLoading && !error && <LoadingBanner year={activeYear} country={activeCountry} />}

      {!isLoading && !error && (
        view === 'timeline'
          ? <TimelineView events={visibleEvents} year={activeYear} highlightInfo={highlightInfo} activeCategories={activeCategories} />
          : <GridView     events={visibleEvents} year={activeYear} highlightInfo={highlightInfo} />
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────

function ViewToggle({ icon: Icon, label, active, onClick }: { icon: LucideIcon; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium transition-colors"
      style={{
        background: active ? 'color-mix(in srgb, var(--color-primary) 14%, transparent)' : 'transparent',
        color: active ? 'var(--color-primary)' : 'var(--color-text-secondary)',
      }}
    >
      <Icon size={12} /> {label}
    </button>
  );
}

function ErrorBanner({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div
      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-sm"
      style={{ borderColor: 'rgba(239,68,68,0.35)', background: 'rgba(239,68,68,0.06)', color: '#b91c1c' }}
    >
      <span className="inline-flex items-center gap-2">
        <AlertCircle size={14} />
        {error.message ?? 'Failed to load calendar events.'}
      </span>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition-colors hover:bg-[var(--color-surface)]"
        style={{ borderColor: 'rgba(239,68,68,0.30)', color: '#991b1b' }}
      >
        <RefreshCw size={11} /> Retry
      </button>
    </div>
  );
}

function LoadingBanner({ year, country }: { year: number; country: CalendarCountry }) {
  return (
    <div className="flex items-center justify-center gap-2 rounded-xl border py-10 text-sm" style={{ borderColor: 'var(--color-divider)', color: 'var(--color-text-tertiary)' }}>
      <Loader2 size={14} className="animate-spin" />
      Loading {country} calendar for {year}…
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// TIMELINE VIEW — Gantt-style with fixed-pixel month columns + native scroll
// ══════════════════════════════════════════════════════════════════════════

const LABEL_WIDTH_PX = 200;
const MONTH_WIDTH_PX = 200;
const TIMELINE_MAX_HEIGHT_PX = 560;
const BAR_HEIGHT_PX = 38; // fits up to 2 lines of wrapped event name
const LANE_GAP_PX = 5;
const ROW_VERTICAL_PADDING_PX = 10;
const BAR_MIN_WIDTH_PX = 92; // single-day events get enough room for full name

interface TimelineEventBar {
  event: CalendarEvent;
  leftPx: number;
  widthPx: number;
}

function TimelineView({
  events,
  year,
  highlightInfo,
  activeCategories,
}: {
  events: CalendarEvent[];
  year: number;
  highlightInfo: { month: number; day: number } | null;
  activeCategories: Set<CalendarEventCategory>;
}) {
  const yearStartMs = new Date(year, 0, 1).getTime();
  const yearEndMs = new Date(year + 1, 0, 1).getTime();
  const totalMs = yearEndMs - yearStartMs;
  const trackWidthPx = 12 * MONTH_WIDTH_PX;

  const rowsByCategory = useMemo(() => {
    const grouped: Record<CalendarEventCategory, TimelineEventBar[]> = {
      festival: [], sale: [], marriage: [], season: [], brand: [], school: [], national: [],
    };
    for (const e of events) {
      const startMs = Math.max(new Date(e.start).getTime(), yearStartMs);
      const endMs = Math.min(new Date(e.end).getTime() + 86_400_000, yearEndMs);
      const rawLeftPx = ((startMs - yearStartMs) / totalMs) * trackWidthPx;
      const rawWidthPx = ((endMs - startMs) / totalMs) * trackWidthPx;

      let leftPx = rawLeftPx;
      let widthPx: number;

      if (e.start === e.end) {
        // Single-day event: clamp the bar inside its own month cell so it
        // never spills into the next month (or past the Dec right edge).
        const monthIdx = new Date(e.start).getMonth();
        const monthStartPx = monthIdx * MONTH_WIDTH_PX;
        const monthEndPx = (monthIdx + 1) * MONTH_WIDTH_PX;
        const maxBarWidth = MONTH_WIDTH_PX - 8;
        widthPx = Math.min(BAR_MIN_WIDTH_PX, maxBarWidth);
        leftPx = Math.max(monthStartPx + 2, Math.min(rawLeftPx, monthEndPx - widthPx - 2));
      } else {
        widthPx = Math.max(rawWidthPx, BAR_MIN_WIDTH_PX);
      }

      grouped[e.category].push({ event: e, leftPx, widthPx });
    }
    return grouped;
  }, [events, totalMs, yearStartMs, yearEndMs, trackWidthPx]);

  const visibleCategories = CATEGORY_ORDER.filter((c) => activeCategories.has(c));

  // Pre-compute lane layout per category so we can size each row to fit
  const rowMeta = useMemo(() => {
    return visibleCategories.map((cat) => {
      const laid = layoutEventLanes(rowsByCategory[cat]);
      const laneCount = laid.reduce((max, b) => Math.max(max, b.lane + 1), 1);
      const rowHeight =
        ROW_VERTICAL_PADDING_PX * 2 + laneCount * BAR_HEIGHT_PX + (laneCount - 1) * LANE_GAP_PX;
      return { cat, laid, rowHeight: Math.max(rowHeight, 56) };
    });
  }, [visibleCategories, rowsByCategory]);

  const todayLeftPx = highlightInfo
    ? ((new Date(year, highlightInfo.month, highlightInfo.day).getTime() - yearStartMs) / totalMs) * trackWidthPx
    : null;

  return (
    <div
      className="overflow-auto rounded-xl border"
      style={{
        background: 'var(--color-surface)',
        borderColor: 'var(--color-divider)',
        maxHeight: TIMELINE_MAX_HEIGHT_PX,
      }}
    >
      <div style={{ width: LABEL_WIDTH_PX + trackWidthPx, position: 'relative' }}>
        {/* ── Sticky header row ─────────────────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            position: 'sticky',
            top: 0,
            zIndex: 3,
            background: 'var(--color-surface-alt, #f8fafc)',
            borderBottom: '1px solid var(--color-divider)',
          }}
        >
          <div
            style={{
              position: 'sticky',
              left: 0,
              zIndex: 4,
              width: LABEL_WIDTH_PX,
              padding: '10px 12px',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--color-text-tertiary)',
              background: 'var(--color-surface-alt, #f8fafc)',
              borderRight: '1px solid var(--color-divider)',
            }}
          >
            Event Timeline
          </div>
          {MONTHS_SHORT.map((m, idx) => {
            const isToday = highlightInfo?.month === idx;
            return (
              <div
                key={m}
                style={{
                  width: MONTH_WIDTH_PX,
                  padding: '10px 0',
                  textAlign: 'center',
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  borderLeft: '1px solid var(--color-divider)',
                  color: isToday ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  background: isToday ? 'color-mix(in srgb, var(--color-primary) 6%, transparent)' : 'transparent',
                }}
              >
                {m}
              </div>
            );
          })}
        </div>

        {/* ── Category rows ─────────────────────────────────────────────── */}
        {rowMeta.map(({ cat, laid, rowHeight }) => {
          const style = CATEGORY_STYLES[cat];
          const Icon = style.icon;
          return (
            <div
              key={cat}
              style={{
                display: 'flex',
                borderBottom: '1px solid var(--color-divider)',
                minHeight: rowHeight,
              }}
            >
              {/* Sticky label cell */}
              <div
                style={{
                  position: 'sticky',
                  left: 0,
                  zIndex: 2,
                  width: LABEL_WIDTH_PX,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 14px',
                  background: 'var(--color-surface)',
                  borderRight: '1px solid var(--color-divider)',
                }}
              >
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 30,
                    height: 30,
                    borderRadius: 8,
                    background: style.bg,
                    color: style.color,
                    flexShrink: 0,
                  }}
                >
                  <Icon size={14} strokeWidth={2.2} />
                </span>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    lineHeight: 1.2,
                    color: 'var(--color-text-primary)',
                  }}
                >
                  {style.label}
                </span>
              </div>

              {/* Timeline track */}
              <div style={{ position: 'relative', width: trackWidthPx, minHeight: rowHeight }}>
                {/* Month grid lines */}
                <div
                  aria-hidden
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                  }}
                >
                  {MONTHS_SHORT.map((m, idx) => {
                    const isToday = highlightInfo?.month === idx;
                    return (
                      <div
                        key={m}
                        style={{
                          width: MONTH_WIDTH_PX,
                          borderLeft: '1px solid var(--color-divider)',
                          background: isToday
                            ? 'color-mix(in srgb, var(--color-primary) 4%, transparent)'
                            : 'transparent',
                        }}
                      />
                    );
                  })}
                </div>

                {/* Today marker */}
                {todayLeftPx !== null && (
                  <div
                    aria-hidden
                    style={{
                      position: 'absolute',
                      top: 0,
                      bottom: 0,
                      width: 1,
                      left: todayLeftPx,
                      background: 'rgba(96,165,250,0.55)',
                    }}
                  />
                )}

                {/* Event bars */}
                {laid.map(({ event, leftPx, widthPx, lane }, i) => {
                  const sameDay = event.start === event.end;
                  return (
                    <div
                      key={`${event.id}-${i}`}
                      style={{
                        position: 'absolute',
                        top: ROW_VERTICAL_PADDING_PX + lane * (BAR_HEIGHT_PX + LANE_GAP_PX),
                        height: BAR_HEIGHT_PX,
                        left: leftPx + 2,
                        width: widthPx - 4,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '4px 8px',
                        borderRadius: 6,
                        background: style.bg,
                        border: `1px solid ${style.border}`,
                        color: style.color,
                        fontSize: 11,
                        fontWeight: 500,
                        overflow: 'hidden',
                        cursor: 'help',
                      }}
                      title={`${event.name}${event.description ? ` — ${event.description}` : ''}\n${formatRange(event)}`}
                    >
                      <span
                        style={{
                          flex: 1,
                          minWidth: 0,
                          lineHeight: 1.2,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          overflowWrap: 'anywhere',
                          wordBreak: 'break-word',
                        }}
                      >
                        {event.name}
                      </span>
                      {sameDay && (
                        <span
                          style={{
                            fontSize: 10,
                            opacity: 0.7,
                            fontVariantNumeric: 'tabular-nums',
                            flexShrink: 0,
                            alignSelf: 'flex-start',
                            marginTop: 1,
                          }}
                        >
                          {new Date(event.start).getDate()}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Pack overlapping bars into vertical lanes so labels remain readable. */
function layoutEventLanes(bars: TimelineEventBar[]): Array<TimelineEventBar & { lane: number }> {
  const sorted = [...bars].sort((a, b) => a.leftPx - b.leftPx);
  const laneEnds: number[] = [];
  const result: Array<TimelineEventBar & { lane: number }> = [];
  for (const bar of sorted) {
    const endPx = bar.leftPx + bar.widthPx;
    let assigned = -1;
    for (let i = 0; i < laneEnds.length; i++) {
      if (laneEnds[i] <= bar.leftPx + 2) {
        assigned = i;
        break;
      }
    }
    if (assigned === -1) {
      assigned = laneEnds.length;
      laneEnds.push(endPx);
    } else {
      laneEnds[assigned] = endPx;
    }
    result.push({ ...bar, lane: assigned });
  }
  return result;
}

function formatRange(e: CalendarEvent): string {
  const start = new Date(e.start);
  if (e.start === e.end) return start.toDateString();
  return `${start.toDateString()} → ${new Date(e.end).toDateString()}`;
}

// ══════════════════════════════════════════════════════════════════════════
// GRID VIEW — original 12-month card grid
// ══════════════════════════════════════════════════════════════════════════

interface SeasonPalette {
  label: string;
  accent: string;
}

// Seasons keep only a tiny accent color used on the month-number tile and
// the season label. The card body and header stay neutral.
const SEASONS: SeasonPalette[] = [
  { label: 'Winter', accent: '#1d4ed8' }, // Jan
  { label: 'Winter', accent: '#1d4ed8' }, // Feb
  { label: 'Spring', accent: '#15803d' }, // Mar
  { label: 'Spring', accent: '#15803d' }, // Apr
  { label: 'Spring', accent: '#15803d' }, // May
  { label: 'Summer', accent: '#c2410c' }, // Jun
  { label: 'Summer', accent: '#c2410c' }, // Jul
  { label: 'Summer', accent: '#c2410c' }, // Aug
  { label: 'Autumn', accent: '#b45309' }, // Sep
  { label: 'Autumn', accent: '#b45309' }, // Oct
  { label: 'Autumn', accent: '#b45309' }, // Nov
  { label: 'Winter', accent: '#1d4ed8' }, // Dec
];

function GridView({
  events,
  year,
  highlightInfo,
}: {
  events: CalendarEvent[];
  year: number;
  highlightInfo: { month: number; day: number } | null;
}) {
  const eventsByMonth = useMemo(() => {
    const buckets: CalendarEvent[][] = Array.from({ length: 12 }, () => []);
    for (const e of events) {
      const start = new Date(e.start);
      const end = new Date(e.end);
      const startMonth = start.getFullYear() < year ? 0 : start.getMonth();
      const endMonth = end.getFullYear() > year ? 11 : end.getMonth();
      for (let m = startMonth; m <= endMonth; m++) buckets[m].push(e);
    }
    buckets.forEach((b) => b.sort((a, b) => a.start.localeCompare(b.start)));
    return buckets;
  }, [events, year]);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {MONTHS_LONG.map((monthName, idx) => {
        const monthEvents = eventsByMonth[idx];
        const isHighlight = highlightInfo?.month === idx;
        const season = SEASONS[idx];
        const monthNum = String(idx + 1).padStart(2, '0');

        return (
          <div
            key={monthName}
            className="flex flex-col overflow-hidden rounded-xl border"
            style={{
              background: 'var(--color-surface)',
              borderColor: isHighlight ? 'rgba(96,165,250,0.45)' : 'var(--color-divider)',
              boxShadow: isHighlight
                ? '0 0 0 1px rgba(96,165,250,0.20)'
                : '0 1px 2px rgba(15,23,42,0.03)',
            }}
          >
            {/* Header — neutral with a single accent on the month tile */}
            <div
              className="flex items-center justify-between border-b px-3 py-2"
              style={{
                borderColor: 'var(--color-divider)',
                background: 'var(--color-surface-alt, #f8fafc)',
              }}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[12px] font-bold tabular-nums"
                  style={{
                    background: `${season.accent}14`,
                    color: season.accent,
                  }}
                >
                  {monthNum}
                </span>
                <div className="flex flex-col leading-none">
                  <span
                    className="text-[12px] font-bold uppercase tracking-wider"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    {monthName}
                  </span>
                  <span
                    className="mt-1 text-[9.5px] font-medium uppercase tracking-[0.12em]"
                    style={{ color: 'var(--color-text-tertiary)' }}
                  >
                    {season.label} · {year}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {isHighlight && (
                  <span
                    className="rounded-full px-1.5 py-px text-[9px] font-bold uppercase tracking-wider"
                    style={{ background: 'var(--color-primary)', color: '#fff' }}
                  >
                    Today
                  </span>
                )}
                <span
                  className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-semibold tabular-nums"
                  style={{
                    background: 'var(--color-surface)',
                    color: 'var(--color-text-secondary)',
                    border: '1px solid var(--color-divider)',
                  }}
                >
                  {monthEvents.length}
                </span>
              </div>
            </div>

            {/* Body */}
            {monthEvents.length === 0 ? (
              <div
                className="flex flex-1 items-center justify-center px-3 py-6 text-center text-[11px] italic"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                No events this month
              </div>
            ) : (
              <ul
                className="flex flex-col divide-y"
                style={{ borderColor: 'var(--color-divider)' }}
              >
                {monthEvents.map((event) => {
                  const style = CATEGORY_STYLES[event.category];
                  const Icon = style.icon;
                  const start = new Date(event.start);
                  const end = new Date(event.end);
                  const sameDay = event.start === event.end;
                  const startMonthInYear = start.getFullYear() === year ? start.getMonth() : 0;
                  const endMonthInYear = end.getFullYear() === year ? end.getMonth() : 11;
                  const spansThisMonth = startMonthInYear !== idx || endMonthInYear !== idx;
                  const dateLabel = sameDay
                    ? String(start.getDate())
                    : startMonthInYear === idx && endMonthInYear === idx
                      ? `${start.getDate()}–${end.getDate()}`
                      : spansThisMonth ? 'All month' : String(start.getDate());

                  return (
                    <li
                      key={`${event.id}-${idx}`}
                      className="flex items-start gap-2 px-3 py-1.5"
                    >
                      <span
                        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md"
                        style={{ background: style.bg, color: style.color }}
                        title={style.label}
                      >
                        <Icon size={11} strokeWidth={2.2} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span
                            className="truncate text-[12px] font-medium leading-tight"
                            style={{ color: 'var(--color-text-primary)' }}
                            title={event.name}
                          >
                            {event.name}
                          </span>
                          <span
                            className="shrink-0 text-[10px] font-semibold tabular-nums"
                            style={{ color: 'var(--color-text-tertiary)' }}
                          >
                            {dateLabel}
                          </span>
                        </div>
                        {event.description && (
                          <p
                            className="mt-0.5 truncate text-[10.5px] leading-snug"
                            style={{ color: 'var(--color-text-tertiary)' }}
                            title={event.description}
                          >
                            {event.description}
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
