import { Controller } from 'react-hook-form';
import { NumberInput } from '@/components/primitives';
import type { FieldProps } from '../tpsFormInterfaceTypes';
import { TpsFieldWrapper } from './TpsFieldWrapper';
import { getByPath } from './TpsFieldError';

export function TpsNumberField({ field, form, layout, mode }: FieldProps) {
  const isDisabled = mode === 'view' || field.disabled;
  const hasError = !!getByPath(form.formState.errors, field.fieldName) &&
    (!!getByPath(form.formState.touchedFields, field.fieldName) || !!getByPath(form.formState.dirtyFields, field.fieldName));

  return (
    <TpsFieldWrapper field={field} form={form} layout={layout} mode={mode}>
      <Controller
        name={field.fieldName}
        control={form.control}
        render={({ field: ctrl }) => (
          <NumberInput
            id={field.fieldName}
            value={ctrl.value === '' ? null : (ctrl.value ?? null)}
            onChange={(v) => {
              ctrl.onChange(v ?? '');
              field.onChange?.(v);
            }}
            placeholder={field.placeholder}
            disabled={isDisabled}
            min={field.rules?.min}
            max={field.rules?.max}
            prefix={field.prefix}
            suffix={field.suffix}
            precision={field.maxFractionDigits ?? 0}
            hasError={hasError}
          />
        )}
      />
    </TpsFieldWrapper>
  );
}
