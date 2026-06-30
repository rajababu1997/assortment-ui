/**
 * Designer review-action modal — single shared modal used by both
 * "Approve" (comment optional) and "Request Revisions" (comment required,
 * 5..2000 chars). The configurable shape keeps the editor footer dumb —
 * it just opens the modal and pipes the comment back on confirm.
 */

import { useEffect, useState } from 'react';
import { Button, Dialog, Textarea } from '@/components/primitives';
import { REVISION_COMMENT_MAX, REVISION_COMMENT_MIN } from '../constants';

interface Props {
  open: boolean;
  /** When true → comment required & length-bounded. When false → optional. */
  requireComment: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  /** 'primary' for approve, 'warning' for revisions (visually distinct CTA). */
  confirmTone: 'primary' | 'warning';
  busy: boolean;
  onCancel: () => void;
  onConfirm: (comment?: string) => Promise<void> | void;
}

export function ReviewActionModal({
  open,
  requireComment,
  title,
  description,
  confirmLabel,
  confirmTone,
  busy,
  onCancel,
  onConfirm,
}: Props) {
  const [value, setValue] = useState('');
  useEffect(() => {
    if (open) setValue('');
  }, [open]);

  const trimmed = value.trim();
  const tooShort = requireComment && trimmed.length < REVISION_COMMENT_MIN;
  const tooLong = trimmed.length > REVISION_COMMENT_MAX;
  const valid = !tooLong && !tooShort;

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      title={title}
      description={description}
      size="md"
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant="secondary" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          <Button
            variant={confirmTone === 'warning' ? 'danger' : 'primary'}
            onClick={() => onConfirm(trimmed || undefined)}
            disabled={!valid || busy}
          >
            {busy ? 'Working…' : confirmLabel}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-2">
        <label className="text-[12.5px] font-medium" style={{ color: 'var(--color-text-secondary)' }}>
          {requireComment
            ? `Comment to buyer (required, ${REVISION_COMMENT_MIN}..${REVISION_COMMENT_MAX} chars)`
            : 'Note to buyer (optional)'}
        </label>
        <Textarea
          value={value}
          onChange={(v) => setValue(v)}
          rows={6}
          maxLength={REVISION_COMMENT_MAX}
          placeholder={
            requireComment
              ? 'e.g. Reduce Slim Fit % in the upper tier — LY ST was only 42%.'
              : 'e.g. Strong mix — proceed.'
          }
          error={
            tooLong
              ? `Trim to ${REVISION_COMMENT_MAX} characters.`
              : value !== '' && tooShort
                ? `At least ${REVISION_COMMENT_MIN} characters.`
                : undefined
          }
        />
        {requireComment && value === '' && (
          <p className="text-[11px]" style={{ color: 'var(--color-text-tertiary)' }}>
            Comment is required for sending back to the buyer.
          </p>
        )}
      </div>
    </Dialog>
  );
}
