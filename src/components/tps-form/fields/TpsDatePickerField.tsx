import { Controller } from 'react-hook-form';
import { DatePicker } from '@/components/primitives';
import type { FieldProps } from '../tpsFormInterfaceTypes';
import { TpsFieldWrapper } from './TpsFieldWrapper';
import { getByPath } from './TpsFieldError';

export function TpsDatePickerField({ field, form, layout, mode }: FieldProps) {
  const isDisabled = mode === 'view' || field.disabled;
  const hasError = !!getByPath(form.formState.errors, field.fieldName) &&
    (!!getByPath(form.formState.touchedFields, field.fieldName) || !!getByPath(form.formState.dirtyFields, field.fieldName));

  return (
    <TpsFieldWrapper field={field} form={form} layout={layout} mode={mode}>
      <Controller
        name={field.fieldName}
        control={form.control}
        render={({ field: ctrl }) => (
          <DatePicker
            value={ctrl.value || ''}
            onChange={(value) => {
              ctrl.onChange(value);
              field.onChange?.(value);
            }}
            minDate={field.minDate}
            maxDate={field.maxDate}
            placeholder={field.placeholder || 'Select date'}
            disabled={isDisabled}
            hasError={hasError}
          />
        )}
      />
    </TpsFieldWrapper>
  );
}
