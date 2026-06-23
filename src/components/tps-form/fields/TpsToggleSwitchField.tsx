import { Controller } from 'react-hook-form';
import { Switch } from '@/components/primitives';
import type { FieldProps } from '../tpsFormInterfaceTypes';
import { TpsFieldError } from './TpsFieldError';

export function TpsToggleSwitchField({ field, form, layout, mode }: FieldProps) {
  const isDisabled = mode === 'view' || field.disabled;

  return (
    <div className={isDisabled ? 'pointer-events-none cursor-default select-none' : ''}>
      <div className={layout === 'row' ? 'tps-field-row' : 'flex flex-col gap-[0.375rem]'}>
        {layout === 'row' && (
          <div className="tps-field-row__label">
            <label className="tps-field-label">{field.label}</label>
          </div>
        )}
        <div className={layout === 'row' ? 'tps-field-row__input' : ''}>
          {layout !== 'row' && (
            <label className="tps-field-label mb-[0.375rem] block">{field.label}</label>
          )}
          <Controller
            name={field.fieldName}
            control={form.control}
            render={({ field: ctrl }) => (
              <Switch
                id={field.fieldName}
                checked={!!ctrl.value}
                onChange={(checked) => {
                  ctrl.onChange(checked);
                  field.onChange?.(checked);
                }}
                disabled={isDisabled}
                label={!!ctrl.value ? 'On' : 'Off'}
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
