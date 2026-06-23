import { useCallback, useEffect, useId, useMemo, useState } from 'react';
import type { FieldValues } from 'react-hook-form';
import { Button } from '../Button';
import { ConfirmDialog } from '../ConfirmDialog';
import { Dialog } from '../Dialog';
import { PrimitiveForm, type FormMode } from '../PrimitiveForm';
import styles from './CrudFormDialog.module.css';
import type { ConfirmConfig, CrudFormDialogProps } from './CrudFormDialog.types';

export function CrudFormDialog<TRecord, TValues extends FieldValues>({
  open,
  onClose,
  mode,
  title,
  data,
  size = 'md',
  closeOnBackdrop = false,
  showCloseButton = true,

  schema,
  validation,
  columns = 1,
  labelPlacement,
  toDefaultValues,
  toPayload,

  createMutation,
  updateMutation,

  confirmTexts,

  submitLabel = 'Submit',
  cancelLabel = 'Cancel',
  extraActions,

  headerSlot,
  footerSlot,

  onChange,
  formRef,
}: CrudFormDialogProps<TRecord, TValues>) {
  const isView = mode === 'view';
  const isEdit = mode === 'edit';
  const isCreate = mode === 'create';

  const hasRequiredFields = schema.some((f) => f.type !== 'section' && (f as { required?: boolean }).required);

  const formId = useId();
  const [pending, setPending] = useState<TValues | null>(null);
  // When validation schema exists, start invalid (required fields empty)
  const [isFormValid, setIsFormValid] = useState(!validation);

  // Reset validity to false when dialog opens (fresh form, required fields are empty)
  useEffect(() => {
    if (open && validation) setIsFormValid(false);
  }, [open, validation]);

  const isSubmitting = (createMutation?.isPending ?? false) || (updateMutation?.isPending ?? false);

  // Rebuild defaults from `data` only when the dialog is open — keeps stable refs across renders.
  const defaultValues = useMemo(
    () => (open ? toDefaultValues(data) : {}),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [open, data]
  );

  const runMutation = useCallback(
    async (values: TValues) => {
      const payload = toPayload ? toPayload(values, { mode, data }) : values;
      if (mode === 'create' && createMutation) {
        await createMutation.mutateAsync(payload);
      } else if (mode === 'edit' && updateMutation) {
        await updateMutation.mutateAsync(payload);
      }
      onClose(true);
    },
    [createMutation, updateMutation, mode, data, toPayload, onClose]
  );

  const handleSubmit = useCallback(
    async (values: TValues) => {
      if (isView) return;
      const cfg = mode === 'create' ? confirmTexts?.create : confirmTexts?.update;
      if (cfg?.skip) {
        await runMutation(values);
        return;
      }
      setPending(values);
    },
    [isView, mode, confirmTexts, runMutation]
  );

  const handleConfirmed = useCallback(async () => {
    if (!pending) return;
    await runMutation(pending);
    setPending(null);
  }, [pending, runMutation]);

  const activeConfirm = useMemo<ConfirmConfig<TValues> | undefined>(() => {
    if (!pending) return undefined;
    return mode === 'create' ? confirmTexts?.create : confirmTexts?.update;
  }, [pending, mode, confirmTexts]);

  const confirmDescription = useMemo(() => {
    if (!pending || !activeConfirm?.description) return undefined;
    const d = activeConfirm.description;
    return typeof d === 'function' ? d(pending) : d;
  }, [pending, activeConfirm]);

  return (
    <Dialog
      open={open}
      onClose={() => onClose()}
      title={title}
      size={size}
      closeOnBackdrop={closeOnBackdrop}
      showCloseButton={showCloseButton}
    >
      {open && (
        <div className={styles.body}>
          {headerSlot && <div className={styles.headerSlot}>{headerSlot}</div>}

          {!isView && hasRequiredFields && (
            <div className={styles.requiredNote}>
              <span className={styles.requiredStar}>*</span> Required Fields
            </div>
          )}

          <PrimitiveForm<TValues>
            schema={schema}
            validation={validation}
            mode={mode as FormMode}
            defaultValues={defaultValues}
            columns={columns}
            labelPlacement={labelPlacement}
            formId={formId}
            onSubmit={handleSubmit}
            onChange={onChange}
            onValidityChange={validation ? setIsFormValid : undefined}
            formRef={formRef}
          />

          {footerSlot && <div className={styles.footerSlot}>{footerSlot}</div>}

          <div className={styles.actions}>
            {extraActions && <div className={styles.extraActions}>{extraActions}</div>}
            <Button variant="secondary" onClick={() => onClose()}>
              {cancelLabel}
            </Button>
            {!isView && (
              <Button
                type="submit"
                form={formId}
                variant="primary"
                disabled={isSubmitting || !isFormValid}
                loading={isSubmitting}
                title={!isFormValid ? 'Please fill in all required fields' : undefined}
              >
                {submitLabel}
              </Button>
            )}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!pending}
        onClose={() => setPending(null)}
        onConfirm={handleConfirmed}
        title={activeConfirm?.title ?? (isCreate ? 'Confirm Create' : 'Confirm Update')}
        description={confirmDescription ?? defaultConfirmDescription(mode)}
        confirmLabel={activeConfirm?.confirmLabel ?? (isCreate ? 'Create' : isEdit ? 'Update' : 'Confirm')}
        variant={activeConfirm?.variant ?? 'primary'}
      />
    </Dialog>
  );
}

function defaultConfirmDescription(mode: FormMode): string {
  if (mode === 'create') return 'Are you sure you want to create this record?';
  if (mode === 'edit') return 'Are you sure you want to save these changes?';
  return '';
}
