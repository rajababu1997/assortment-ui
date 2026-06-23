import clsx from 'clsx';
import fieldCss from '../../primitives/_shared/field.module.css';
import inputCss from '../../primitives/Input/Input.module.css';
import type { FieldProps } from '../tpsFormInterfaceTypes';
import { TpsFieldWrapper } from './TpsFieldWrapper';
import { getByPath } from './TpsFieldError';

export function TpsPasswordField({ field, form, layout, mode }: FieldProps) {
  const { register } = form;
  const isDisabled = mode === 'view' || field.disabled;
  const hasError = !!getByPath(form.formState.errors, field.fieldName) &&
    (!!getByPath(form.formState.touchedFields, field.fieldName) || !!getByPath(form.formState.dirtyFields, field.fieldName));

  return (
    <TpsFieldWrapper field={field} form={form} layout={layout} mode={mode}>
      <div className={clsx(fieldCss.container, hasError && fieldCss.containerError, isDisabled && fieldCss.containerDisabled)}>
        <input
          id={field.fieldName}
          type="password"
          {...register(field.fieldName, {
            onChange: (e) => field.onChange?.(e.target.value),
          })}
          placeholder={field.placeholder}
          disabled={isDisabled}
          autoComplete="current-password"
          className={inputCss.input}
          style={{ width: '100%' }}
        />
      </div>
    </TpsFieldWrapper>
  );
}
