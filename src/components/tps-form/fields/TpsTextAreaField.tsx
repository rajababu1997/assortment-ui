import clsx from 'clsx';
import textareaCss from '../../primitives/Textarea/Textarea.module.css';
import type { FieldProps } from '../tpsFormInterfaceTypes';
import { TpsFieldWrapper } from './TpsFieldWrapper';
import { getByPath } from './TpsFieldError';

export function TpsTextAreaField({ field, form, layout, mode }: FieldProps) {
  const { register } = form;
  const isDisabled = mode === 'view' || field.disabled;
  const hasError = !!getByPath(form.formState.errors, field.fieldName) &&
    (!!getByPath(form.formState.touchedFields, field.fieldName) || !!getByPath(form.formState.dirtyFields, field.fieldName));

  return (
    <TpsFieldWrapper field={field} form={form} layout={layout} mode={mode}>
      <div className={clsx(
        textareaCss.container,
        hasError && textareaCss.containerError,
        isDisabled && textareaCss.containerDisabled,
      )}>
        <textarea
          id={field.fieldName}
          {...register(field.fieldName, {
            onChange: (e) => field.onChange?.(e.target.value),
          })}
          placeholder={field.placeholder}
          disabled={isDisabled}
          rows={field.rows ?? 3}
          className={textareaCss.textarea}
        />
      </div>
      {field.rules?.maxLength && (
        <small style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-xs)' }}>
          Max {field.rules.maxLength} characters
        </small>
      )}
    </TpsFieldWrapper>
  );
}
