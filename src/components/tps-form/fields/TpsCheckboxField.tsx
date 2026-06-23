import { Controller } from 'react-hook-form';
import { Checkbox } from '@/components/primitives';
import type { FieldProps } from '../tpsFormInterfaceTypes';
import { TpsFieldError } from './TpsFieldError';

export function TpsCheckboxField({ field, form, layout, mode }: FieldProps) {
  const isDisabled = mode === 'view' || field.disabled;

  return (
    <div className={isDisabled ? 'opacity-60 pointer-events-none' : ''}>
      <div className={layout === 'row' ? 'tps-field-row' : 'flex flex-col gap-[0.375rem]'}>
        {layout === 'row' && (
          <label htmlFor={field.fieldName} className="tps-field-row__label tps-field-label cursor-pointer select-none">
            {field.label}
          </label>
        )}
        <div className={layout === 'row' ? 'tps-field-row__input mt-[0.375rem]' : ''}>
          <Controller
            name={field.fieldName}
            control={form.control}
            render={({ field: ctrl }) => (
              <Checkbox
                id={field.fieldName}
                checked={!!ctrl.value}
                onChange={(checked) => {
                  ctrl.onChange(checked);
                  field.onChange?.(checked);
                }}
                label={layout !== 'row' ? field.label : undefined}
                disabled={isDisabled}
              />
            )}
          />
          {field.hint && (
            <p className="text-xs leading-snug text-[var(--color-text-tertiary)] mt-[0.25rem]">
              {field.hint}
            </p>
          )}
          <TpsFieldError fieldName={field.fieldName} label={field.label} form={form} />
        </div>
      </div>
    </div>
  );
}
