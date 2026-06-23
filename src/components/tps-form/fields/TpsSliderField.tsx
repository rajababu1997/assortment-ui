import { Controller } from 'react-hook-form';
import type { FieldProps } from '../tpsFormInterfaceTypes';
import { TpsFieldWrapper } from './TpsFieldWrapper';

export function TpsSliderField({ field, form, layout, mode }: FieldProps) {
  const isDisabled = mode === 'view' || field.disabled;
  const min = field.rules?.min ?? 0;
  const max = field.rules?.max ?? 100;

  return (
    <TpsFieldWrapper field={field} form={form} layout={layout} mode={mode}>
      <Controller
        name={field.fieldName}
        control={form.control}
        render={({ field: ctrl }) => {
          const current = typeof ctrl.value === 'number' ? ctrl.value : min;
          return (
            <div className="flex items-center gap-[0.75rem]">
              <input
                type="range"
                min={min}
                max={max}
                value={current}
                disabled={isDisabled}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  ctrl.onChange(v);
                  field.onChange?.(v);
                }}
                style={{
                  flex: 1,
                  height: 4,
                  accentColor: 'var(--color-primary)',
                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                  opacity: isDisabled ? 0.6 : 1,
                }}
              />
              <span className="text-sm font-medium text-[var(--color-text)] min-w-[2.5rem] text-right tabular-nums">
                {current}
              </span>
            </div>
          );
        }}
      />
    </TpsFieldWrapper>
  );
}
