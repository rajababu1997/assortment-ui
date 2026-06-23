/**
 * Import Configuration dialog — file picker for restoring a previously exported
 * JSON bundle. Validates the bundle's structure via configStorage.importConfig.
 */

import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { Button, Dialog } from '@/components/primitives';
import { toast } from '@/lib/toast';
import { useImportConfig } from '../useSetup';

interface ImportDialogProps {
  open: boolean;
  onClose: () => void;
}

export function ImportConfigDialog({ open, onClose }: ImportDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const importMutation = useImportConfig();
  const [picked, setPicked] = useState<File | null>(null);

  const handleClose = () => {
    setPicked(null);
    onClose();
  };

  const handleUpload = async () => {
    if (!picked) return;
    try {
      const text = await picked.text();
      const parsed: unknown = JSON.parse(text);
      importMutation.mutate(parsed, {
        onSuccess: () => handleClose(),
      });
    } catch {
      toast.error('Selected file is not valid JSON');
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Import Configuration"
      size="md"
      closeOnBackdrop={false}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            leftIcon={<Upload size={14} strokeWidth={2} />}
            disabled={!picked || importMutation.isPending}
            loading={importMutation.isPending}
            onClick={handleUpload}
          >
            Import
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4 p-2">
        <p className="text-sm text-[var(--color-text-secondary)]">
          Select a JSON file previously exported from this app. Importing will overwrite the
          current configuration.
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="application/json,.json"
          onChange={(e) => setPicked(e.target.files?.[0] ?? null)}
          className="block w-full text-sm rounded border border-[var(--color-divider)] p-2"
        />
        {picked && (
          <div className="text-sm">
            Selected: <span className="font-medium">{picked.name}</span> ({Math.round(picked.size / 1024)} KB)
          </div>
        )}
      </div>
    </Dialog>
  );
}
