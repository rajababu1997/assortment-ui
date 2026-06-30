/**
 * OTB Setup — unified form model.
 *
 * Single Zod schema spans all 8 fields. Submit is atomic: persists Company,
 * TimeConfig, and ReleaseConfig as one transaction (see `submitWizard` in
 * configStorage). Same shape is used for both initial setup and editing.
 */

import { z } from 'zod';
import type { Company, ReleaseConfig, TimeConfig, WizardFormValues } from '../types';

export const setupFormSchema = z
  .object({
    // Company
    name: z
      .string()
      .min(3, 'Company name must be at least 3 characters')
      .max(100, 'Max 100 characters'),
    base_currency: z.enum(['INR', 'USD', 'EUR', 'GBP'], {
      errorMap: () => ({ message: 'Pick a base currency' }),
    }),

    // Time period
    planning_horizon_months: z
      .number({ invalid_type_error: 'Pick a planning horizon' })
      .int()
      .min(3, 'Min 3 months')
      .max(24, 'Max 24 months'),
    lead_time_days: z
      .number({ invalid_type_error: 'Pick a lead time' })
      .int()
      .min(20, 'Min 20 days')
      .max(180, 'Max 180 days'),
    planning_cycle: z.enum(['weekly', 'monthly', 'quarterly'], {
      errorMap: () => ({ message: 'Pick a planning cycle' }),
    }),
    allow_mid_planning: z.boolean(),

    // Release window
    lock_deadline_days_before: z
      .number({ invalid_type_error: 'Enter lock deadline (days)' })
      .int()
      .min(1, 'Min 1 day')
      .max(365, 'Max 365 days'),
    release_day_of_week: z.enum([
      'any',
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
      'sunday',
    ]),
  })
  .superRefine((v, ctx) => {
    if (v.lead_time_days / 30 > v.planning_horizon_months) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['lead_time_days'],
        message: `Lead time (${(v.lead_time_days / 30).toFixed(1)} months) exceeds planning horizon (${v.planning_horizon_months} months).`,
      });
    }
    if (v.lock_deadline_days_before >= v.lead_time_days) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['lock_deadline_days_before'],
        message: `Lock deadline (${v.lock_deadline_days_before}d) must be less than lead time (${v.lead_time_days}d).`,
      });
    }
  });

// Pre-filled with sensible demo defaults so a fresh tenant doesn't have to
// type anything to get past Setup — they can just hit Save and continue to
// OTB Planning. Override anything by editing the form before saving.
export const SETUP_FORM_DEFAULTS: WizardFormValues = {
  name: 'RKs Fashion Ltd',
  base_currency: 'INR',
  planning_horizon_months: 12,
  lead_time_days: 90,
  planning_cycle: 'monthly',
  allow_mid_planning: false,
  lock_deadline_days_before: 60,
  release_day_of_week: 'any',
};

/** Build form defaults from a previously-saved setup. */
export function toFormValues(
  company: Company | null,
  time: TimeConfig | null,
  release: ReleaseConfig | null,
): WizardFormValues {
  return {
    name: company?.name ?? SETUP_FORM_DEFAULTS.name,
    base_currency: company?.base_currency ?? SETUP_FORM_DEFAULTS.base_currency,
    planning_horizon_months: time?.planning_horizon_months ?? SETUP_FORM_DEFAULTS.planning_horizon_months,
    lead_time_days: time?.lead_time_days ?? SETUP_FORM_DEFAULTS.lead_time_days,
    planning_cycle: time?.planning_cycle ?? SETUP_FORM_DEFAULTS.planning_cycle,
    allow_mid_planning: time?.allow_mid_planning ?? SETUP_FORM_DEFAULTS.allow_mid_planning,
    lock_deadline_days_before:
      release?.lock_deadline_days_before ?? SETUP_FORM_DEFAULTS.lock_deadline_days_before,
    release_day_of_week: release?.release_day_of_week ?? SETUP_FORM_DEFAULTS.release_day_of_week,
  };
}
