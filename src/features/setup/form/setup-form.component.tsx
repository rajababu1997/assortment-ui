/**
 * OTB Setup — single-page form.
 *
 * Renders inside the SetupPage card (header already rendered above us).
 * Layout: form fills the available card height; sections scroll inside,
 * the action bar (Reset + Save) stays pinned at the card bottom.
 *
 * Coding/styling pattern lifted from `isetinal_ui/admin/persons/create-edit-person`:
 *   - section grouping with icon pill + title + helper text
 *   - schema-driven Zod validation
 *   - one mutation for both create + update (atomic submit)
 */

import { useEffect, useMemo, type ReactNode } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Briefcase,
  CalendarRange,
  Clock4,
  RotateCcw,
  Save,
} from 'lucide-react';
import {
  Button,
  Input,
  NumberInput,
  Radio,
  Select,
  Switch,
} from '@/components/primitives';
import { useSubmitWizard } from '../useSetup';
import {
  SETUP_FORM_DEFAULTS,
  setupFormSchema,
  toFormValues,
} from './setup-form.model';
import type {
  BaseCurrency,
  Company,
  DayOfWeek,
  PlanningCycle,
  ReleaseConfig,
  TimeConfig,
  WizardFormValues,
} from '../types';

interface Props {
  company: Company | null;
  timeConfig: TimeConfig | null;
  releaseConfig: ReleaseConfig | null;
  /** Extra blocks (backup history, storage status, danger zone) rendered
   *  below the form sections in the scrollable area. */
  adminToolingSlot?: ReactNode;
}

const CURRENCY_OPTIONS: { value: BaseCurrency; label: string }[] = [
  { value: 'INR', label: 'INR — Indian Rupee (₹)' },
  { value: 'USD', label: 'USD — US Dollar ($)' },
  { value: 'EUR', label: 'EUR — Euro (€)' },
  { value: 'GBP', label: 'GBP — British Pound (£)' },
];

const HORIZON_OPTIONS: { value: number; label: string }[] = [
  { value: 3, label: '3 months (Fast Fashion)' },
  { value: 4, label: '4 months' },
  { value: 6, label: '6 months' },
  { value: 12, label: '12 months (Full Year)' },
  { value: 13, label: '13 months (Rolling)' },
];

const LEAD_TIME_OPTIONS: { value: number; label: string }[] = [
  { value: 30, label: '30 days (Fast Fashion)' },
  { value: 60, label: '60 days' },
  { value: 90, label: '90 days (Traditional)' },
  { value: 120, label: '120 days (Luxury)' },
];

const CYCLE_OPTIONS: { value: PlanningCycle; label: string }[] = [
  { value: 'weekly', label: 'Weekly — one round each week' },
  { value: 'monthly', label: 'Monthly — one round each month' },
  { value: 'quarterly', label: 'Quarterly — one round each quarter' },
];

const DAY_OF_WEEK_OPTIONS: { value: DayOfWeek; label: string }[] = [
  { value: 'any', label: 'Any day' },
  { value: 'monday', label: 'Monday only' },
  { value: 'tuesday', label: 'Tuesday only' },
  { value: 'wednesday', label: 'Wednesday only' },
  { value: 'thursday', label: 'Thursday only' },
  { value: 'friday', label: 'Friday only' },
  { value: 'saturday', label: 'Saturday only' },
  { value: 'sunday', label: 'Sunday only' },
];

export function SetupForm({ company, timeConfig, releaseConfig, adminToolingSlot }: Props) {
  const isEdit = !!company;
  const initialValues = useMemo(
    () => toFormValues(company, timeConfig, releaseConfig),
    [company, timeConfig, releaseConfig],
  );

  const form = useForm<WizardFormValues>({
    defaultValues: initialValues,
    resolver: zodResolver(setupFormSchema),
    mode: 'onSubmit',
  });

  useEffect(() => {
    form.reset(initialValues);
  }, [initialValues, form]);

  const submitMutation = useSubmitWizard();

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = form;

  const leadTime = watch('lead_time_days');
  const deadline = watch('lock_deadline_days_before');
  const vendorWindow = Math.max(0, leadTime - deadline);

  const onSubmit = (values: WizardFormValues) => {
    submitMutation.mutate(values);
  };

  const onReset = () => {
    reset(isEdit ? initialValues : SETUP_FORM_DEFAULTS);
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex min-h-0 flex-1 flex-col"
      noValidate
    >
      {/* ── Scrollable form body ─────────────────────────────────────────── */}
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-3 py-3 md:px-4">
        <FormSection
          icon={<Briefcase size={16} strokeWidth={2} />}
          title="Company"
          subtitle="Identity and currency context for this OTB configuration."
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Controller
              control={control}
              name="name"
              render={({ field }) => (
                <Input
                  label="Company Name"
                  required
                  placeholder="e.g. ABC Fashion"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.name?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="base_currency"
              render={({ field }) => (
                <Select<BaseCurrency>
                  label="Base Currency"
                  required
                  placeholder="Pick a currency"
                  value={field.value}
                  onChange={field.onChange}
                  options={CURRENCY_OPTIONS}
                  error={errors.base_currency?.message}
                />
              )}
            />
          </div>
        </FormSection>

        <FormSection
          icon={<Clock4 size={16} strokeWidth={2} />}
          title="Time Period"
          subtitle="How far ahead OTBs are planned and how long production takes."
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Controller
              control={control}
              name="planning_horizon_months"
              render={({ field }) => (
                <Select<number>
                  label="Planning Horizon"
                  required
                  placeholder="Pick a horizon"
                  value={field.value}
                  onChange={field.onChange}
                  options={HORIZON_OPTIONS}
                  error={errors.planning_horizon_months?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="lead_time_days"
              render={({ field }) => (
                <Select<number>
                  label="Drafting → Stock at store (days)"
                  required
                  placeholder="Pick a total cycle length"
                  value={field.value}
                  onChange={field.onChange}
                  options={LEAD_TIME_OPTIONS}
                  error={errors.lead_time_days?.message}
                />
              )}
            />
          </div>
          <Controller
            control={control}
            name="planning_cycle"
            render={({ field }) => (
              <Radio<PlanningCycle>
                name="planning_cycle"
                label="Planning Cycle"
                required
                value={field.value}
                onChange={field.onChange}
                options={CYCLE_OPTIONS}
                orientation="vertical"
                error={errors.planning_cycle?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="allow_mid_planning"
            render={({ field }) => (
              <Switch
                label="Allow mid-cycle re-planning"
                description="If on, OTBs already locked can still be revised mid-cycle."
                checked={field.value}
                onChange={field.onChange}
              />
            )}
          />
        </FormSection>

        <FormSection
          icon={<CalendarRange size={16} strokeWidth={2} />}
          title="Release Window"
          subtitle="When OTBs must be locked, relative to the start of the execution month."
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Controller
              control={control}
              name="lock_deadline_days_before"
              render={({ field }) => (
                <NumberInput
                  label="Lock OTB → Stock at store (days)"
                  required
                  min={1}
                  max={365}
                  value={field.value || null}
                  onChange={(v) => field.onChange(v ?? 0)}
                  suffix="days"
                  error={errors.lock_deadline_days_before?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="release_day_of_week"
              render={({ field }) => (
                <Select<DayOfWeek>
                  label="Release Day"
                  value={field.value}
                  onChange={field.onChange}
                  options={DAY_OF_WEEK_OPTIONS}
                  error={errors.release_day_of_week?.message}
                />
              )}
            />
          </div>
          {vendorWindow > 0 && deadline > 0 && (
            <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
              After lock, the vendor has{' '}
              <span className="font-medium">{vendorWindow} days</span> remaining for production + shipping.
            </p>
          )}
        </FormSection>

        {adminToolingSlot}
      </div>

      {/* ── Pinned action bar inside the card ────────────────────────────── */}
      <div
        className="flex shrink-0 items-center justify-end gap-2 border-t bg-[var(--color-surface)] px-3 py-2 md:px-4"
        style={{ borderColor: 'var(--color-divider)' }}
      >
        <Button
          variant="secondary"
          type="button"
          leftIcon={<RotateCcw size={14} strokeWidth={2} />}
          disabled={!isDirty || submitMutation.isPending}
          onClick={onReset}
        >
          Reset
        </Button>
        <Button
          variant="primary"
          type="submit"
          loading={submitMutation.isPending}
          disabled={!isDirty}
          leftIcon={<Save size={14} strokeWidth={2} />}
        >
          {isEdit ? 'Save changes' : 'Save configuration'}
        </Button>
      </div>
    </form>
  );
}

interface SectionProps {
  icon: ReactNode;
  title: string;
  subtitle: string;
  children: ReactNode;
}

function FormSection({ icon, title, subtitle, children }: SectionProps) {
  return (
    <section
      className="flex flex-col gap-3 rounded-xl border p-3"
      style={{
        background: 'var(--color-surface)',
        borderColor: 'var(--color-divider)',
      }}
    >
      <div className="flex items-start gap-3">
        <span
          className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-md"
          style={{
            background: 'color-mix(in srgb, var(--color-primary) 12%, transparent)',
            color: 'var(--color-primary)',
          }}
        >
          {icon}
        </span>
        <div>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            {title}
          </h3>
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            {subtitle}
          </p>
        </div>
      </div>
      {children}
    </section>
  );
}
