import { Controller } from 'react-hook-form';
import type { FieldProps } from '../tpsFormInterfaceTypes';
import { TpsFieldWrapper } from './TpsFieldWrapper';

export function TpsRadioField({ field, form, layout, mode }: FieldProps) {
  const isDisabled = mode === 'view' || field.disabled;

  return (
    <TpsFieldWrapper field={field} form={form} layout={layout} mode={mode}>
      <Controller
        name={field.fieldName}
        control={form.control}
        render={({ field: ctrl }) => (
          <div className="flex flex-wrap items-center gap-[1.5rem]" style={{ minHeight: '2.5rem' }}>
            {(field.options ?? []).map((opt) => {
              const isChecked = String(ctrl.value) === String(opt.value);
              const id = `${field.fieldName}_${opt.value}`;
              return (
                <label
                  key={String(opt.value)}
                  htmlFor={id}
                  className="flex cursor-pointer select-none items-center gap-[0.5rem]"
                  style={{ opacity: isDisabled ? 0.7 : 1 }}
                >
                  {/* Custom radio circle */}
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '1.25rem',
                      height: '1.25rem',
                      borderRadius: '50%',
                      border: `2px solid ${
                        isChecked
                          ? isDisabled
                            ? 'var(--color-text-tertiary, #94a3b8)'
                            : 'var(--color-primary, #3B82F6)'
                          : 'var(--color-text-tertiary, #94a3b8)'
                      }`,
                      background: 'transparent',
                      transition: 'border-color 0.15s ease',
                      flexShrink: 0,
                    }}
                  >
                    {isChecked && (
                      <span
                        style={{
                          width: '0.625rem',
                          height: '0.625rem',
                          borderRadius: '50%',
                          background: isDisabled
                            ? 'var(--color-text-tertiary, #94a3b8)'
                            : 'var(--color-primary, #3B82F6)',
                        }}
                      />
                    )}
                  </span>
                  <input
                    type="radio"
                    id={id}
                    name={field.fieldName}
                    value={String(opt.value)}
                    checked={isChecked}
                    onChange={() => {
                      if (!isDisabled) {
                        ctrl.onChange(opt.value);
                        field.onChange?.(opt.value);
                      }
                    }}
                    disabled={isDisabled}
                    className="sr-only"
                  />
                  <span className="text-sm text-[var(--color-text)]">{opt.label}</span>
                </label>
              );
            })}
          </div>
        )}
      />
    </TpsFieldWrapper>
  );
}
