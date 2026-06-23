import type { ReactNode, RefObject } from 'react';
import type { FieldValues, UseFormReturn } from 'react-hook-form';
import type { ZodTypeAny } from 'zod';
import type { UseMutationResult } from '@tanstack/react-query';
import type { FormSchema, FormMode } from '../PrimitiveForm';
import type { DialogSize } from '../Dialog';
import type { ConfirmVariant } from '../ConfirmDialog';

/** Config for the pre-submit confirm dialog in a given mode. */
export interface ConfirmConfig<V> {
  title?: string;
  /** Either a static string or a function of the submitted values. */
  description?: string | ((values: V) => string);
  confirmLabel?: string;
  variant?: ConfirmVariant;
  /** Skip confirmation entirely in this mode. Default false. */
  skip?: boolean;
}

export interface CrudFormDialogProps<TRecord, TValues extends FieldValues> {
  // ── Dialog state ────────────────────────────────────────────────────────
  open: boolean;
  onClose: (refreshNeeded?: boolean) => void;
  mode: FormMode;
  title: ReactNode;
  data: TRecord | null;
  size?: DialogSize;
  closeOnBackdrop?: boolean;
  showCloseButton?: boolean;

  // ── Form config ─────────────────────────────────────────────────────────
  schema: FormSchema;
  validation?: ZodTypeAny;
  columns?: 1 | 2;
  labelPlacement?: 'top' | 'left';
  /** Convert the selected record into form values (runs on open/data change). */
  toDefaultValues: (data: TRecord | null) => Partial<TValues>;
  /** Optional transform before the mutation runs. Common use: inject `uuid`, keep original `code`. */
  toPayload?: (values: TValues, ctx: { mode: FormMode; data: TRecord | null }) => unknown;

  // ── Mutations ───────────────────────────────────────────────────────────
  /** Mutation for CREATE mode. Accepts the payload (post-`toPayload` transform). */
  createMutation?: UseMutationResult<unknown, unknown, unknown, unknown>;
  /** Mutation for EDIT mode. Accepts the payload (post-`toPayload` transform). */
  updateMutation?: UseMutationResult<unknown, unknown, unknown, unknown>;

  // ── Confirmation ────────────────────────────────────────────────────────
  /** Per-mode confirm config. Omit to use sensible defaults. Set `skip: true` to bypass. */
  confirmTexts?: {
    create?: ConfirmConfig<TValues>;
    update?: ConfirmConfig<TValues>;
  };

  // ── Buttons ─────────────────────────────────────────────────────────────
  submitLabel?: string;
  cancelLabel?: string;
  /** Extra actions rendered to the left of Cancel/Submit in the footer. */
  extraActions?: ReactNode;

  // ── Escape hatches ──────────────────────────────────────────────────────
  /** Rendered above the form (e.g., banner, section info). */
  headerSlot?: ReactNode;
  /** Rendered below the form (e.g., custom sections that don't fit a schema field). */
  footerSlot?: ReactNode;

  // ── Imperative / reactive escape hatches ────────────────────────────────
  /** Called on every field change — use for cascading logic (e.g. dob → age). */
  onChange?: (values: Partial<TValues>, changedField: string | null) => void;
  /** Ref exposed to the consumer so they can call setValue / watch imperatively. */
  formRef?: RefObject<UseFormReturn<TValues> | null>;
}
