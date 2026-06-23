import { CheckCircle2, HelpCircle, Sparkles } from 'lucide-react';
import type { ReactNode } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import type { FormLayout, FormMode, ResolvedField } from '../tpsFormInterfaceTypes';
import { TpsFieldError, getByPath } from './TpsFieldError';

interface FieldWrapperProps {
  field: ResolvedField;
  form: UseFormReturn<any>;
  layout: FormLayout;
  mode: FormMode;
  children: ReactNode;
}

export function TpsFieldWrapper({ field, form, layout, mode, children }: FieldWrapperProps) {
  const isDisabled = mode === 'view' || field.disabled;
  const hasLabel = !!field.label;
  const isRequired = hasLabel && field.rules?.required && !isDisabled;

  /* Validation state for inline feedback */
  const { errors, touchedFields, dirtyFields } = form.formState;
  const error = getByPath(errors, field.fieldName);
  const isTouched = getByPath(touchedFields, field.fieldName);
  const isDirty = getByPath(dirtyFields, field.fieldName);
  const showValid = isRequired && !error && (isTouched || isDirty) && (mode as string) !== 'view';

  /* Label element — shared between row & column layouts */
  const labelEl = (hasLabel || field.tooltip) ? (
    <div className="flex items-center gap-[0.5rem]">
      {hasLabel && (
        <label
          htmlFor={field.fieldName}
          className="tps-field-label"
        >
          {field.label}
          {isRequired && (
            <span className="text-[var(--color-danger)] font-bold ml-[0.125rem]">*</span>
          )}
        </label>
      )}
      {field.tooltip && <TooltipIcon tooltip={field.tooltip} />}
      {/* Validation checkmark for valid required fields */}
      {showValid && (
        <CheckCircle2 size={12} strokeWidth={2} className="text-[var(--color-success)] opacity-80" />
      )}
    </div>
  ) : null;

  /* Input + hint + AI hint + error */
  const inputEl = (
    <div className="flex flex-col gap-[0.25rem]">
      {children}
      {field.hint && (
        <p className="text-md leading-snug text-[var(--color-text-tertiary)]">
          {field.hint}
        </p>
      )}
      {field.aiHint && mode !== 'view' && (
        <div className="inline-flex items-center gap-1.5 mt-0.5 px-2 py-0.5 rounded-full text-[0.6875rem] font-medium w-fit"
          style={{
            background: 'linear-gradient(135deg, var(--color-info-50), var(--color-purple-50))',
            color: 'var(--color-purple-700)',
            border: '1px solid var(--color-purple-100)',
          }}
        >
          <Sparkles size={10} strokeWidth={2} className="text-[var(--color-purple-500)]" />
          {field.aiHint}
        </div>
      )}
      <TpsFieldError fieldName={field.fieldName} label={field.label} form={form} />
    </div>
  );

  return (
    <div className={isDisabled ? 'pointer-events-none' : ''}>
      {layout === 'row' ? (
        /* Row layout: label left (col-md-5 = 41.66%), input right (col-md-7 = 58.33%) */
        <div className="tps-field-row">
          <div className="tps-field-row__label">
            {labelEl}
          </div>
          <div className="tps-field-row__input">
            {inputEl}
          </div>
        </div>
      ) : (
        /* Column layout: label above input */
        <div className="flex flex-col gap-[0.375rem]">
          {labelEl}
          {inputEl}
        </div>
      )}
    </div>
  );
}

/* ── Tooltip Icon (pure CSS, no PrimeReact Tooltip) ─────────────────────── */

function TooltipIcon({ tooltip }: { tooltip: string }) {
  return (
    <span className="relative inline-flex group/tip">
      <HelpCircle size={16} strokeWidth={2} className="cursor-pointer text-[var(--color-text-tertiary)] group-hover/tip:text-[var(--color-primary)] transition-colors duration-150" />
      <span
        role="tooltip"
        className="
          pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-[0.5rem] z-[var(--z-tooltip)]
          w-max max-w-[15rem] px-[0.75rem] py-[0.5rem] rounded-md
          text-xs leading-relaxed font-normal text-left
          bg-[var(--color-tooltip-bg)] text-[var(--color-tooltip-text)]
          shadow-lg ring-1 ring-black/5 dark:ring-white/5
          opacity-0 scale-95 translate-y-[0.25rem]
          group-hover/tip:opacity-100 group-hover/tip:scale-100 group-hover/tip:translate-y-0
          transition-all duration-200 ease-out origin-bottom
        "
      >
        {/* Arrow */}
        <span
          className="
            absolute left-1/2 -translate-x-1/2 -bottom-[0.3125rem]
            w-[0.625rem] h-[0.625rem] rotate-45
            bg-[var(--color-tooltip-bg)]
            ring-1 ring-black/5 dark:ring-white/5
            [clip-path:polygon(0%_100%,100%_100%,100%_0%)]
          "
        />
        <span className="relative">{tooltip}</span>
      </span>
    </span>
  );
}
