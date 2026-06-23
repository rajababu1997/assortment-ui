import { Controller } from 'react-hook-form';
import { SegmentedControl } from '@/components/primitives';
import type { FieldProps } from '../tpsFormInterfaceTypes';
import { TpsFieldWrapper } from './TpsFieldWrapper';

export function TpsSegmentedControlField({ field, form, layout, mode }: FieldProps) {
  const isDisabled = mode === 'view' || field.disabled;
  const options = (field.options ?? []).map((o) => ({
    value: o.value,
    label: String(o.label),
  }));

  return (
    <TpsFieldWrapper field={field} form={form} layout={layout} mode={mode}>
      <Controller
        name={field.fieldName}
        control={form.control}
        render={({ field: ctrl }) => (
          <SegmentedControl
            options={options}
            value={ctrl.value ?? null}
            onChange={(v) => {
              if (!isDisabled) {
                ctrl.onChange(v);
                field.onChange?.(v);
              }
            }}
            variant={field.segmentedVariant ?? 'cyan'}
            fullWidth
            disabled={isDisabled}
          />
        )}
      />
    </TpsFieldWrapper>
  );
}
