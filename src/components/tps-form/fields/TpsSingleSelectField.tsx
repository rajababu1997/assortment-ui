import { Controller } from 'react-hook-form';
import { Select } from '@/components/primitives';
import type { FieldProps } from '../tpsFormInterfaceTypes';
import { TpsFieldWrapper } from './TpsFieldWrapper';
import { getByPath } from './TpsFieldError';

export function TpsSingleSelectField({ field, form, layout, mode }: FieldProps) {
  const isDisabled = mode === 'view' || field.disabled;
  const hasError = !!getByPath(form.formState.errors, field.fieldName) &&
    (!!getByPath(form.formState.touchedFields, field.fieldName) || !!getByPath(form.formState.dirtyFields, field.fieldName));

  return (
    <TpsFieldWrapper field={field} form={form} layout={layout} mode={mode}>
      <Controller
        name={field.fieldName}
        control={form.control}
        render={({ field: ctrl }) => (
          <Select
            id={field.fieldName}
            value={ctrl.value}
            onChange={(v) => {
              ctrl.onChange(v);
              field.onChange?.(v);
            }}
            options={field.options ?? []}
            placeholder={field.placeholder}
            disabled={isDisabled}
            hasError={hasError}
          />
        )}
      />
    </TpsFieldWrapper>
  );
}
