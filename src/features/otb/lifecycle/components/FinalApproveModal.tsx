/**
 * Final-approval modal — Admin closes an OTB. Optional but recommended
 * remark; lands on the lifecycle audit row and shows up next to the
 * FINAL_APPROVED stage card on the detail page.
 *
 * Pattern mirrors `option/ReviewActionModal` — the page opens it and
 * pipes the note back on confirm.
 */

import { useEffect, useState } from 'react';
import { Button, Dialog, Textarea } from '@/components/primitives';

const NOTE_MAX = 2000;

interface Props {
  open: boolean;
  busy: boolean;
  onCancel: () => void;
  onConfirm: (note?: string) => Promise<void> | void;
}

export function FinalApproveModal({ open, busy, onCancel, onConfirm }: Props) {
  const [value, setValue] = useState('');
  useEffect(() => {
    if (open) setValue('');
  }, [open]);

  const trimmed = value.trim();
  const tooLong = trimmed.length > NOTE_MAX;

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      title="Final approve OTB"
      description="Closing the OTB locks every downstream artefact — VP, OP, and all comments become read-only. This action is recorded in the audit log and can't be undone from the UI."
      size="md"
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant="secondary" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => onConfirm(trimmed || undefined)}
            disabled={tooLong || busy}
          >
            {busy ? 'Working…' : 'Final approve'}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-2">
        <label className="text-[12.5px] font-medium" style={{ color: 'var(--color-text-secondary)' }}>
          Closing remark (optional, up to {NOTE_MAX} chars)
        </label>
        <Textarea
          value={value}
          onChange={(v) => setValue(v)}
          rows={6}
          maxLength={NOTE_MAX}
          placeholder="e.g. Approved as planned — ready for buying."
          error={tooLong ? `Trim to ${NOTE_MAX} characters.` : undefined}
        />
      </div>
    </Dialog>
  );
}
