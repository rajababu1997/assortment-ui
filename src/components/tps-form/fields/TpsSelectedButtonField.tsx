import { Controller } from 'react-hook-form';
import type { FieldProps } from '../tpsFormInterfaceTypes';
import { TpsFieldWrapper } from './TpsFieldWrapper';

export function TpsSelectedButtonField({ field, form, layout, mode }: FieldProps) {
  const isDisabled = mode === 'view' || field.disabled;
  const options = field.options ?? [];

  return (
    <TpsFieldWrapper field={field} form={form} layout={layout} mode={mode}>
      <Controller
        name={field.fieldName}
        control={form.control}
        render={({ field: ctrl }) => (
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {options.map((opt) => {
              const isSelected = ctrl.value === opt.value;
              return (
                <button
                  key={String(opt.value)}
                  type="button"
                  disabled={isDisabled || opt.disabled}
                  onClick={() => {
                    ctrl.onChange(opt.value);
                    field.onChange?.(opt.value);
                  }}
                  style={{
                    padding: '6px 14px', borderRadius: 6,
                    border: `1px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    background: isSelected ? 'var(--color-primary)' : 'var(--color-surface)',
                    color: isSelected ? '#fff' : 'var(--color-text)',
                    fontSize: '0.875rem', fontWeight: isSelected ? 600 : 400,
                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                    opacity: isDisabled ? 0.6 : 1,
                    transition: 'background 0.15s, border-color 0.15s, color 0.15s',
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        )}
      />
    </TpsFieldWrapper>
  );
}
