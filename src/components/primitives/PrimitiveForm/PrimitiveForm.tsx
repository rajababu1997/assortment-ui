import { useEffect, type CSSProperties, type FormEvent } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import type { Control, FieldValues, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import clsx from 'clsx';
import { snackbar } from '@/lib/snackbar';
import { Checkbox } from '../Checkbox';
import { DatePicker } from '../DatePicker';
import { FileUpload } from '../FileUpload';
import { Input } from '../Input';
import { MultiSelect } from '../MultiSelect';
import { NumberInput } from '../NumberInput';
import { Radio } from '../Radio';
import { Select } from '../Select';
import { Switch } from '../Switch';
import { Textarea } from '../Textarea';
import fieldCss from '../_shared/field.module.css';
import styles from './PrimitiveForm.module.css';
import type { FieldSchema, FormMode, PrimitiveFormProps, SectionSchema } from './PrimitiveForm.types';

// ── Visibility / disabled helpers ────────────────────────────────────────────

function isFieldDisabled(field: Exclude<FieldSchema, SectionSchema>, mode: FormMode): boolean {
  if (mode === 'view') return true;
  if (field.disabled) return true;
  if (field.disabledIn?.includes(mode)) return true;
  return false;
}

function isFieldVisible(field: FieldSchema, values: Record<string, unknown>): boolean {
  if (field.show == null) return true;
  if (typeof field.show === 'function') return field.show(values);
  return field.show;
}

// ── Main component ──────────────────────────────────────────────────────────

export function PrimitiveForm<T extends FieldValues = FieldValues>({
  schema,
  validation,
  mode,
  defaultValues,
  columns = 1,
  labelPlacement = 'top',
  rowLabelOptions,
  formId,
  onSubmit,
  onChange,
  onValidityChange,
  formRef,
  className,
}: PrimitiveFormProps<T>) {
  const rowLabelStyle =
    labelPlacement === 'left'
      ? ({
          ...(rowLabelOptions?.labelWidth && { '--tps-label-width': rowLabelOptions.labelWidth }),
          ...(rowLabelOptions?.inputMaxWidth && { '--tps-input-max-width': rowLabelOptions.inputMaxWidth }),
          ...(rowLabelOptions?.rowGap && { '--tps-row-gap': rowLabelOptions.rowGap }),
        } as CSSProperties)
      : undefined;
  const form = useForm<T>({
    resolver: validation ? zodResolver(validation) : undefined,
    mode: 'onChange',
    defaultValues: defaultValues as never,
  });

  // Reset form whenever defaultValues change (e.g., dialog reopens with new row data)
  useEffect(() => {
    form.reset(defaultValues as never);
  }, [defaultValues, form]);

  // Expose form instance for imperative control (watch, setValue, etc.)
  useEffect(() => {
    if (formRef) formRef.current = form;
  }, [form, formRef]);

  // Emit value changes to parent (for cascading dropdowns or live preview)
  useEffect(() => {
    if (!onChange) return;
    const sub = form.watch((values, info) => {
      onChange(values as Partial<T>, info.name ?? null);
    });
    return () => sub.unsubscribe();
  }, [form, onChange]);

  // Notify parent when validity changes
  useEffect(() => {
    if (!onValidityChange) return;
    // Report initial validity
    onValidityChange(form.formState.isValid);
    const sub = form.watch(() => {
      onValidityChange(form.formState.isValid);
    });
    return () => sub.unsubscribe();
  }, [form, onValidityChange]);

  // Live values for `show` predicates
  const liveValues = useWatch({ control: form.control }) ?? {};

  const handleFormSubmit = onSubmit
    ? form.handleSubmit(
        (values) => onSubmit(values as T),
        (errors) => {
          // Show toast notification when validation fails
          const errorMessages = Object.values(errors)
            .map((err) => (err as { message?: string })?.message)
            .filter(Boolean);

          if (errorMessages.length > 0) {
            const message =
              errorMessages.length === 1
                ? errorMessages[0]
                : `Please fill in all required fields (${errorMessages.length} errors)`;
            snackbar.warn(message);
          }
        }
      )
    : (e: FormEvent) => e.preventDefault();

  return (
    <form
      id={formId}
      onSubmit={handleFormSubmit}
      noValidate
      className={clsx(
        styles.form,
        columns === 2 && styles.cols2,
        labelPlacement === 'left' && 'tps-form-rows',
        className
      )}
      style={rowLabelStyle}
    >
      {schema.map((field, i) => {
        if (!isFieldVisible(field, liveValues)) return null;

        if (field.type === 'section') {
          return (
            <div key={`section-${field.name ?? i}`} className={styles.section}>
              {field.icon && <span className={styles.sectionIcon}>{field.icon}</span>}
              <span className={styles.sectionLabel}>{field.label}</span>
            </div>
          );
        }

        const colSpanClass = field.colSpan === 2 ? styles.col2 : styles.col1;
        const disabled = isFieldDisabled(field, mode);

        return (
          <div key={field.name} className={clsx(colSpanClass, styles.fieldWrap)}>
            <FieldRenderer
              field={field}
              control={form.control as unknown as Control<FieldValues>}
              form={form as unknown as UseFormReturn<FieldValues>}
              mode={mode}
              values={liveValues as Record<string, unknown>}
              disabled={disabled}
              labelPlacement={labelPlacement}
            />
            {field.helperText && !form.formState.errors[field.name] && (
              <span className={styles.helperText}>{field.helperText}</span>
            )}
          </div>
        );
      })}
    </form>
  );
}

// ── Field renderer ──────────────────────────────────────────────────────────

function FieldRenderer({
  field,
  control,
  form,
  mode,
  values,
  disabled,
  labelPlacement,
}: {
  field: Exclude<FieldSchema, SectionSchema>;
  control: Control<FieldValues>;
  form: UseFormReturn<FieldValues>;
  mode: FormMode;
  values: Record<string, unknown>;
  disabled: boolean;
  labelPlacement?: 'top' | 'left';
}) {
  return (
    <Controller
      name={field.name}
      control={control}
      render={({ field: rhfField, fieldState }) => {
        const error = fieldState.error?.message;

        switch (field.type) {
          case 'text':
          case 'email':
          case 'password':
          case 'tel':
          case 'url':
          case 'search':
            return (
              <Input
                label={field.label}
                placeholder={field.placeholder}
                required={field.required}
                disabled={disabled}
                type={field.type}
                value={(rhfField.value as string) ?? ''}
                onChange={rhfField.onChange}
                onBlur={rhfField.onBlur}
                error={error}
                maxLength={field.maxLength}
                minLength={field.minLength}
                clearable={field.clearable}
                autoComplete={field.autoComplete}
                infoText={field.info}
              />
            );

          case 'date':
            return (
              <div className={fieldCss.root}>
                {field.label && (
                  <label className={fieldCss.label}>
                    {field.label}
                    {field.required && <span style={{ color: 'var(--color-danger)', marginLeft: 2 }}>*</span>}
                  </label>
                )}
                <DatePicker
                  value={(rhfField.value as string) ?? null}
                  onChange={rhfField.onChange}
                  disabled={disabled}
                  hasError={!!error}
                  showTime={false}
                  minDate={field.min as unknown as string | Date}
                  maxDate={field.max as unknown as string | Date}
                  placeholder={field.placeholder ?? 'DD MMM YYYY'}
                />
                {error && (
                  <div className={fieldCss.errorMessage} role="alert">
                    {error}
                  </div>
                )}
                {field.info && <span className={fieldCss.infoText}>{field.info}</span>}
              </div>
            );

          case 'datetime-local':
            return (
              <div className={fieldCss.root}>
                {field.label && (
                  <label className={fieldCss.label}>
                    {field.label}
                    {field.required && <span style={{ color: 'var(--color-danger)', marginLeft: 2 }}>*</span>}
                  </label>
                )}
                <DatePicker
                  value={(rhfField.value as string) ?? null}
                  onChange={rhfField.onChange}
                  disabled={disabled}
                  hasError={!!error}
                  showTime={true}
                  minDate={field.min as unknown as string | Date}
                  maxDate={field.max as unknown as string | Date}
                  placeholder={field.placeholder ?? 'DD MMM YYYY, HH:MM'}
                />
                {error && (
                  <div className={fieldCss.errorMessage} role="alert">
                    {error}
                  </div>
                )}
                {field.info && <span className={fieldCss.infoText}>{field.info}</span>}
              </div>
            );

          case 'time':
            return (
              <Input
                label={field.label}
                placeholder={field.placeholder}
                required={field.required}
                disabled={disabled}
                type={field.type}
                value={(rhfField.value as string) ?? ''}
                onChange={rhfField.onChange}
                onBlur={rhfField.onBlur}
                error={error}
                clearable={true}
                infoText={field.info}
              />
            );

          case 'file':
            return (
              <FileUpload
                label={field.label}
                required={field.required}
                disabled={disabled}
                value={(rhfField.value as File | null) ?? null}
                onChange={rhfField.onChange}
                error={error}
                accept={field.accept}
                maxSize={field.maxSize}
                preview={field.preview}
                previewUrl={field.previewUrl}
                previewLoading={field.previewLoading}
                previewHeight={field.previewHeight}
                hint={field.hint}
              />
            );

          case 'textarea':
            return (
              <Textarea
                label={field.label}
                placeholder={field.placeholder}
                required={field.required}
                disabled={disabled}
                value={(rhfField.value as string) ?? ''}
                onChange={rhfField.onChange}
                onBlur={rhfField.onBlur}
                error={error}
                rows={field.rows}
                maxLength={field.maxLength}
                autosize={field.autosize}
                infoText={field.info}
              />
            );

          case 'number':
            return (
              <NumberInput
                label={field.label}
                placeholder={field.placeholder}
                required={field.required}
                disabled={disabled}
                value={(rhfField.value as number | null) ?? null}
                onChange={rhfField.onChange}
                error={error}
                min={field.min}
                max={field.max}
                step={field.step}
                precision={field.precision}
                prefix={field.prefix}
                suffix={field.suffix}
                showButtons={field.showButtons}
                infoText={field.info}
              />
            );

          case 'select': {
            const isClearable = field.clearable ?? true;
            return (
              <Select
                label={field.label}
                placeholder={field.placeholder}
                required={field.required}
                disabled={disabled}
                value={(rhfField.value as string) || null}
                onChange={rhfField.onChange}
                options={field.options}
                error={error}
                infoText={field.info}
                clearable={isClearable}
                onClear={isClearable ? () => rhfField.onChange('') : undefined}
              />
            );
          }

          case 'multiselect':
            return (
              <MultiSelect
                label={field.label}
                placeholder={field.placeholder}
                required={field.required}
                disabled={disabled}
                value={(rhfField.value as string[]) ?? []}
                onChange={rhfField.onChange}
                options={field.options}
                error={error}
                searchable={field.searchable}
                maxChips={field.maxChips}
                infoText={field.info}
              />
            );

          case 'checkbox': {
            const cbLabel = field.checkboxLabel ?? field.label;
            if (labelPlacement === 'left' && cbLabel) {
              return (
                <div className={styles.boolRow}>
                  <span className={styles.boolRowLabel}>
                    {cbLabel}
                    {field.required && <span style={{ color: 'var(--color-danger)', marginLeft: 2 }}>*</span>}
                  </span>
                  <Checkbox
                    label=""
                    required={field.required}
                    disabled={disabled}
                    checked={Boolean(rhfField.value)}
                    onChange={rhfField.onChange}
                    error={error}
                  />
                </div>
              );
            }
            return (
              <Checkbox
                label={cbLabel}
                required={field.required}
                disabled={disabled}
                checked={Boolean(rhfField.value)}
                onChange={rhfField.onChange}
                error={error}
              />
            );
          }

          case 'switch': {
            if (labelPlacement === 'left' && field.label) {
              return (
                <div className={styles.boolRow}>
                  <span className={styles.boolRowLabel}>
                    {field.label}
                    {field.required && <span style={{ color: 'var(--color-danger)', marginLeft: 2 }}>*</span>}
                  </span>
                  <Switch
                    label=""
                    description={field.description}
                    required={field.required}
                    disabled={disabled}
                    checked={Boolean(rhfField.value)}
                    onChange={rhfField.onChange}
                    error={error}
                  />
                </div>
              );
            }
            return (
              <Switch
                label={field.label}
                description={field.description}
                required={field.required}
                disabled={disabled}
                checked={Boolean(rhfField.value)}
                onChange={rhfField.onChange}
                error={error}
              />
            );
          }

          case 'radio':
            return (
              <Radio
                name={field.name}
                label={field.label}
                required={field.required}
                disabled={disabled}
                value={(rhfField.value as string) ?? null}
                onChange={rhfField.onChange}
                options={field.options}
                error={error}
                orientation={field.orientation}
                infoText={field.info}
              />
            );

          case 'datepicker':
            return (
              <div className={fieldCss.root}>
                {field.label && (
                  <label className={fieldCss.label}>
                    {field.label}
                    {field.required && <span style={{ color: 'var(--color-danger)', marginLeft: 2 }}>*</span>}
                  </label>
                )}
                <DatePicker
                  value={(rhfField.value as string) ?? null}
                  onChange={rhfField.onChange}
                  disabled={disabled}
                  hasError={!!error}
                  showTime={field.showTime}
                  minDate={field.minDate}
                  maxDate={field.maxDate}
                  placeholder={field.placeholder ?? 'Select date'}
                />
                {error && (
                  <div className={fieldCss.errorMessage} role="alert">
                    {error}
                  </div>
                )}
              </div>
            );

          case 'custom':
            return <>{field.render({ control, form, mode, values, disabled })}</>;
        }
      }}
    />
  );
}
