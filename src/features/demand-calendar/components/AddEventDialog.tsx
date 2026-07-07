/**
 * Dialog for adding a user-created demand calendar event. Collects every
 * field the SignalCard renders, so a saved event is visually indistinguishable
 * from the seeded ones (aside from a small "Custom" pill).
 */

import { useMemo, useState } from 'react';
import { Wand2 } from 'lucide-react';
import { Button, Dialog, Input, Select, Textarea } from '@/components/primitives';
import type { DateConfidence, Signal, SignalCategory } from '../types';
import { ACTION_LABEL, CATEGORY_LABEL, CONFIDENCE_LABEL } from '../utils';

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (event: Signal) => void;
}

type DateMode = 'single' | 'period';

interface FormState {
  title: string;
  dateMode: DateMode;
  date: string;
  periodStart: string;
  periodEnd: string;
  signalCategory: SignalCategory;
  dateConfidence: DateConfidence;
  coverageRegions: string;
  sourceName: string;
  sourceNote: string;
  action: string;
  primaryCategory: string;
  secondaryCategories: string;
  reasoning: string;
}

const EMPTY_FORM: FormState = {
  title: '',
  dateMode: 'single',
  date: '',
  periodStart: '',
  periodEnd: '',
  signalCategory: 'RETAIL_PROMO_WINDOW',
  dateConfidence: 'MEDIUM_ANNOUNCED',
  coverageRegions: 'ALL_INDIA',
  sourceName: '',
  sourceNote: '',
  action: 'PROMO_PLANNING',
  primaryCategory: '',
  secondaryCategories: '',
  reasoning: '',
};

/** Auto-fill preset — Winter EOSS (Dec 2026 → Jan 2027). */
const WINTER_EOSS_PRESET: FormState = {
  title: 'End of Season Sale — Winter (AW26)',
  dateMode: 'period',
  date: '',
  periodStart: '2026-12-26',
  periodEnd: '2027-01-31',
  signalCategory: 'END_OF_SEASON_SALE',
  dateConfidence: 'MEDIUM_ANNOUNCED',
  coverageRegions: 'ALL_INDIA',
  sourceName: 'Industry EOSS calendar (mainline apparel retailers)',
  sourceNote: 'Winter EOSS typically opens the day after Christmas and stretches to end-January, ahead of SS27 intake.',
  action: 'MARKDOWN_PLANNING',
  primaryCategory: 'Winter Apparel (Markdown)',
  secondaryCategories: 'Outerwear, Knitwear, Party / Occasion Wear',
  reasoning: 'Clearance window for AW26 stock. Combine with post-Christmas gifting-return traffic. Plan depth of markdowns for outerwear and knitwear which have short salable windows in most of India.',
};

const CATEGORY_OPTIONS = Object.entries(CATEGORY_LABEL).map(([value, label]) => ({
  value: value as SignalCategory,
  label,
}));

const CONFIDENCE_OPTIONS = Object.entries(CONFIDENCE_LABEL).map(([value, label]) => ({
  value: value as DateConfidence,
  label,
}));

const ACTION_OPTIONS = Object.entries(ACTION_LABEL).map(([value, label]) => ({ value, label }));

function csvToList(input: string): string[] {
  return input
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function genId(): string {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `USR-${Date.now()}-${rand}`;
}

export function AddEventDialog({ open, onClose, onSave }: Props) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const reset = () => {
    setForm(EMPTY_FORM);
    setErrors({});
  };

  const autoFill = () => {
    setForm(WINTER_EOSS_PRESET);
    setErrors({});
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const validate = (): boolean => {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.title.trim()) next.title = 'Required';
    if (form.dateMode === 'single') {
      if (!form.date) next.date = 'Required';
    } else {
      if (!form.periodStart) next.periodStart = 'Required';
      if (!form.periodEnd) next.periodEnd = 'Required';
      if (form.periodStart && form.periodEnd && form.periodEnd < form.periodStart) {
        next.periodEnd = 'End must be on or after start';
      }
    }
    if (csvToList(form.coverageRegions).length === 0) next.coverageRegions = 'Required';
    if (!form.sourceName.trim()) next.sourceName = 'Required';
    if (!form.primaryCategory.trim()) next.primaryCategory = 'Required';
    if (!form.reasoning.trim()) next.reasoning = 'Required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const signal: Signal = {
      id: genId(),
      title: form.title.trim(),
      ...(form.dateMode === 'single'
        ? { date: form.date }
        : { period: { start: form.periodStart, end: form.periodEnd } }),
      signalCategory: form.signalCategory,
      dateConfidence: form.dateConfidence,
      dateType: 'USER_DEFINED',
      coverageRegions: csvToList(form.coverageRegions),
      sourceCitation: {
        name: form.sourceName.trim(),
        ...(form.sourceNote.trim() ? { note: form.sourceNote.trim() } : {}),
      },
      planningRelevance: {
        primaryCategory: form.primaryCategory.trim(),
        ...(csvToList(form.secondaryCategories).length > 0
          ? { secondaryCategories: csvToList(form.secondaryCategories) }
          : {}),
        planningReviewStart: '',
        stockLandBy: '',
        action: form.action,
        reasoning: form.reasoning.trim(),
      },
    };
    onSave(signal);
    reset();
    onClose();
  };

  const footer = useMemo(
    () => (
      <div className="flex items-center justify-end gap-2">
        <Button variant="secondary" onClick={handleClose}>Cancel</Button>
        <Button variant="primary" onClick={handleSubmit}>Save event</Button>
      </div>
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [form],
  );

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Add calendar event"
      description="Custom events live on this device only — they persist across logout/login."
      size="lg"
      footer={footer}
    >
      <div className="flex flex-col gap-4">
        <div
          className="flex items-center justify-between gap-3 rounded-md border px-3 py-2"
          style={{
            borderColor: 'var(--color-divider)',
            background: 'var(--color-surface-alt, #f8fafc)',
          }}
        >
          <div className="min-w-0">
            <div
              className="text-[12px] font-semibold"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Quick start
            </div>
            <div
              className="text-[11px]"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              Prefill fields with the December End of Season Sale template.
            </div>
          </div>
          <button
            type="button"
            onClick={autoFill}
            className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border px-2.5 text-[11.5px] font-medium transition-colors"
            style={{
              borderColor: 'rgba(96,165,250,0.45)',
              color: 'var(--color-primary)',
              background: 'var(--color-surface)',
            }}
          >
            <Wand2 size={13} />
            Auto-fill
          </button>
        </div>

        <Section title="Event">
          <Input
            label="Title"
            value={form.title}
            onChange={(v) => set('title', v)}
            placeholder="e.g. End of season sale"
            required
            error={errors.title}
            clearable={false}
          />

          <div>
            <div
              className="mb-1 text-[11px] font-medium"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Date type
            </div>
            <div className="inline-flex overflow-hidden rounded-md border"
              style={{ borderColor: 'var(--color-divider)' }}>
              {(['single', 'period'] as DateMode[]).map((m) => {
                const active = form.dateMode === m;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => set('dateMode', m)}
                    className="px-3 py-1.5 text-[12px] font-medium"
                    style={{
                      background: active ? 'var(--color-primary)' : 'var(--color-surface)',
                      color: active ? '#fff' : 'var(--color-text-secondary)',
                    }}
                  >
                    {m === 'single' ? 'Single day' : 'Period'}
                  </button>
                );
              })}
            </div>
          </div>

          {form.dateMode === 'single' ? (
            <Input
              label="Date"
              type="date"
              value={form.date}
              onChange={(v) => set('date', v)}
              required
              error={errors.date}
              clearable={false}
            />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input
                label="Start"
                type="date"
                value={form.periodStart}
                onChange={(v) => set('periodStart', v)}
                required
                error={errors.periodStart}
                clearable={false}
              />
              <Input
                label="End"
                type="date"
                value={form.periodEnd}
                onChange={(v) => set('periodEnd', v)}
                required
                error={errors.periodEnd}
                clearable={false}
              />
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Select
              label="Category"
              value={form.signalCategory}
              onChange={(v) => set('signalCategory', v as SignalCategory)}
              options={CATEGORY_OPTIONS as { value: string; label: string }[]}
              required
            />
            <Select
              label="Date confidence"
              value={form.dateConfidence}
              onChange={(v) => set('dateConfidence', v as DateConfidence)}
              options={CONFIDENCE_OPTIONS as { value: string; label: string }[]}
              required
            />
          </div>

          <Input
            label="Coverage regions"
            value={form.coverageRegions}
            onChange={(v) => set('coverageRegions', v)}
            placeholder="Comma-separated, e.g. ALL_INDIA, NORTH, WEST"
            required
            error={errors.coverageRegions}
            clearable={false}
          />
        </Section>

        <Section title="Source">
          <Input
            label="Source name"
            value={form.sourceName}
            onChange={(v) => set('sourceName', v)}
            placeholder="e.g. Retailer merchandising calendar"
            required
            error={errors.sourceName}
            clearable={false}
          />
          <Textarea
            label="Source note"
            value={form.sourceNote}
            onChange={(v) => set('sourceNote', v)}
            placeholder="Optional context about the source"
            rows={2}
          />
        </Section>

        <Section title="Merchandiser guidance">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Select
              label="Action"
              value={form.action}
              onChange={(v) => set('action', v as string)}
              options={ACTION_OPTIONS}
              required
            />
            <Input
              label="Primary category"
              value={form.primaryCategory}
              onChange={(v) => set('primaryCategory', v)}
              placeholder="e.g. Retail Promotion Window"
              required
              error={errors.primaryCategory}
              clearable={false}
            />
          </div>
          <Input
            label="Secondary categories"
            value={form.secondaryCategories}
            onChange={(v) => set('secondaryCategories', v)}
            placeholder="Comma-separated, e.g. Casual Wear, Electronics"
            clearable={false}
          />
          <Textarea
            label="Reasoning"
            value={form.reasoning}
            onChange={(v) => set('reasoning', v)}
            placeholder="Why does this event matter for planning?"
            rows={3}
            required
            error={errors.reasoning}
          />
        </Section>
      </div>
    </Dialog>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h4
        className="text-[10px] font-bold uppercase tracking-[0.14em]"
        style={{ color: 'var(--color-text-tertiary)' }}
      >
        {title}
      </h4>
      {children}
    </section>
  );
}
