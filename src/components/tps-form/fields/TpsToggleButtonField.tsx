import { Controller } from 'react-hook-form';
import { Switch } from '@/components/primitives';
import type { FieldProps } from '../tpsFormInterfaceTypes';
import { TpsFieldWrapper } from './TpsFieldWrapper';

export function TpsToggleButtonField({ field, form, layout, mode }: FieldProps) {
  const isDisabled = mode === 'view' || field.disabled;
  const onLabel = field.placeholder || 'Yes';
  const offLabel = field.placeholder ? `Not ${field.placeholder}` : 'No';

  return (
    <TpsFieldWrapper field={field} form={form} layout={layout} mode={mode}>
      <Controller
        name={field.fieldName}
        control={form.control}
        render={({ field: ctrl }) => (
          <Switch
            id={field.fieldName}
            checked={!!ctrl.value}
            onChange={(checked) => {
              if (!isDisabled) {
                ctrl.onChange(checked);
                field.onChange?.(checked);
              }
            }}
            label={ctrl.value ? onLabel : offLabel}
            disabled={isDisabled}
          />
        )}
      />
    </TpsFieldWrapper>
  );
}
