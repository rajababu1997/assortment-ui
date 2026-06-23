import { HelpCircle, Plus, X } from 'lucide-react';
import { useMemo } from 'react';
import { useFieldArray } from 'react-hook-form';
import { Button, Tooltip } from '@/components/primitives';
import type { FieldProps, ResolvedField, FormSchema } from '../tpsFormInterfaceTypes';
import { FIELD_MAP } from './index';
import { FORM_MODES } from '../constants';

export function TpsMultiFormField({ field, form, mode }: FieldProps) {
  const isViewMode = mode === FORM_MODES.VIEW;
  const isCreateMode = mode === FORM_MODES.CREATE;
  const isDisabled = isViewMode || field.disabled;

  const { fields: rows, append, remove } = useFieldArray({
    control: form.control,
    name: field.fieldName,
  });

  const subFieldSchemas = useMemo(() => {
    if (!field.controls) return [];
    return Object.entries(field.controls).map(([key, schema]) => ({ key, schema }));
  }, [field.controls]);

  const emptyRow = useMemo(() => {
    if (!field.controls) return {};
    const row: Record<string, any> = {};
    for (const [key, sub] of Object.entries(field.controls)) {
      row[key] = sub.value ?? '';
    }
    return row;
  }, [field.controls]);

  if (!field.controls || subFieldSchemas.length === 0) return null;

  return (
    <div className="flex flex-col gap-[0.5rem] mt-[0.75rem] mb-[0.5rem]">
      {/* Section label + tooltip */}
      <div className="flex items-center gap-[0.5rem]">
        <span className="text-lg font-semibold leading-[1.125rem] text-[var(--color-text-secondary)]">
          {field.label}
          {field.rules?.required && !isDisabled && (
            <span className="text-[var(--color-danger)] font-bold ml-[0.125rem]">*</span>
          )}
        </span>
        {field.tooltip && (
          <Tooltip content={field.tooltip} placement="bottom">
            <HelpCircle size={16} strokeWidth={2} className="cursor-pointer text-[var(--color-text-tertiary)]" />
          </Tooltip>
        )}
      </div>

      {/* Rows */}
      <div className="flex flex-col gap-[1rem]">
        {rows.map((row, rowIndex) => (
          <div key={row.id} className="flex flex-row items-end gap-[1rem] w-full min-w-0">
            {/* Sub-fields */}
            {subFieldSchemas.map(({ key, schema }) => {
              if (schema.show === false) return null;
              const Component = FIELD_MAP[schema.type];
              if (!Component) return null;

              const subField: ResolvedField = {
                ...schema,
                fieldName: `${field.fieldName}.${rowIndex}.${key}`,
                label: rowIndex === 0 ? schema.label : '',
                show: true,
              };

              return (
                <div key={key} className="flex-1 min-w-0 [&_.tps-field-error-slot]:min-h-[1.75rem]">
                  <Component field={subField} form={form} layout="column" mode={mode} />
                </div>
              );
            })}

            {/* Add / Delete buttons */}
            {!isViewMode && (
              <div className="flex flex-row gap-[0.5rem] shrink-0 w-[4.5rem] justify-start mb-[0.125rem]">
                {(isCreateMode || rowIndex === rows.length - 1) && (
                  <Tooltip content="Add More..." placement="bottom">
                    <button
                      type="button"
                      onClick={() => append(emptyRow)}
                      style={{
                        width: 32, height: 32, borderRadius: '50%',
                        border: '1px solid var(--color-info)',
                        background: 'transparent', color: 'var(--color-info)',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-info-50)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <Plus size={14} strokeWidth={2} />
                    </button>
                  </Tooltip>
                )}

                {(isCreateMode ? rowIndex > 0 : true) ? (
                  <Tooltip content="Delete" placement="bottom">
                    <button
                      type="button"
                      onClick={() => remove(rowIndex)}
                      style={{
                        width: 32, height: 32, borderRadius: '50%',
                        border: '1px solid var(--color-danger)',
                        background: 'transparent', color: 'var(--color-danger)',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-danger-50, rgba(220,38,38,0.06))'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <X size={14} strokeWidth={2} />
                    </button>
                  </Tooltip>
                ) : (
                  <span className="inline-block w-[2rem] h-[2rem] opacity-0 pointer-events-none" aria-hidden="true" />
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
