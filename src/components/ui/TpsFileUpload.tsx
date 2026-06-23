/**
 * TpsFileUpload — Drag-and-drop file upload component.
 *
 * Ported from Angular tps-file-upload. Uses native HTML5 drag/drop
 * instead of ngx-file-drop dependency.
 *
 * Features:
 *   - Drag & drop zone with visual feedback
 *   - Click-to-browse fallback
 *   - File type validation (configurable)
 *   - Single or multiple file support
 *   - Enriches files with metadata (size, icon, base64 preview)
 *   - Integrates with TpsFileList for display
 */

import { useCallback, useRef, useState } from 'react';
import { CloudUpload, Upload } from 'lucide-react';
import { Button } from '@/components/primitives';
import { snackbar } from '@/lib/snackbar';
import { isFileAllowed, enrichFile } from '@/utils/fileUtils';
import type { EnrichedFile } from '@/utils/fileUtils';
import { TpsFileList } from './TpsFileList';

export interface TpsFileUploadProps {
  /** Comma-separated allowed extensions (e.g., "pdf,jpg,png"). Default: "pdf,jpg,jpeg,png" */
  allowedTypes?: string;
  /** Allow multiple file selection. Default: true */
  multiple?: boolean;
  /** Existing files to display */
  files?: EnrichedFile[];
  /** Called when new files are dropped/selected */
  onUpload: (files: EnrichedFile[]) => void;
  /** Called when a file is removed */
  onDelete: (file: EnrichedFile) => void;
  /** Show the file list below upload zone. Default: true */
  showFileList?: boolean;
  /** Custom label. Default: "Drop files here" */
  label?: string;
  /** Disable the upload zone */
  disabled?: boolean;
}

export function TpsFileUpload({
  allowedTypes = 'pdf,jpg,jpeg,png',
  multiple = true,
  files = [],
  onUpload,
  onDelete,
  showFileList = true,
  label = 'Drop files here',
  disabled = false,
}: TpsFileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback(async (fileList: FileList | File[]) => {
    const rawFiles = Array.from(fileList);

    // Validate file types
    const validFiles: File[] = [];
    for (const file of rawFiles) {
      if (isFileAllowed(file.name, allowedTypes)) {
        validFiles.push(file);
      } else {
        snackbar.warn(`File type not allowed: ${file.name}`);
      }
    }

    if (!multiple && validFiles.length > 1) {
      snackbar.warn('Only single file upload is allowed');
      validFiles.splice(1);
    }

    if (validFiles.length === 0) return;

    // Enrich files with metadata + base64 preview
    const enriched = await Promise.all(validFiles.map(enrichFile));
    onUpload(enriched);
  }, [allowedTypes, multiple, onUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (disabled) return;
    if (e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  }, [disabled, processFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragOver(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleBrowse = useCallback(() => {
    if (!disabled) inputRef.current?.click();
  }, [disabled]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
      // Reset input so same file can be re-selected
      e.target.value = '';
    }
  }, [processFiles]);

  return (
    <div className="flex flex-col gap-3">
      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        aria-label={`File upload zone. ${label}. Allowed types: ${allowedTypes}. ${multiple ? 'Multiple files allowed' : 'Single file only'}`}
        aria-disabled={disabled}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleBrowse}
        onKeyDown={e => e.key === 'Enter' && handleBrowse()}
        className={`
          flex flex-col items-center justify-center gap-2 p-6 rounded-lg border-2 border-dashed
          transition-colors duration-200 cursor-pointer
          ${disabled
            ? 'border-[var(--surface-border)] bg-[var(--surface-ground)] opacity-60 cursor-not-allowed'
            : isDragOver
              ? 'border-[var(--primary-color)] bg-blue-50 dark:bg-blue-900/10'
              : 'border-[var(--surface-border)] bg-[var(--surface-ground)] hover:border-[var(--primary-color)] hover:bg-blue-50 dark:hover:bg-blue-900/5'
          }
        `}
      >
        <CloudUpload size={32} color="var(--primary-color)" strokeWidth={2} />
        <span className="text-sm font-medium text-[var(--text-color)]">{label}</span>
        <Button
          variant="secondary"
          size="sm"
          type="button"
          leftIcon={<Upload size={14} strokeWidth={2} />}
          onClick={e => { e.stopPropagation(); handleBrowse(); }}
          disabled={disabled}
        >
          Browse
        </Button>
        <span className="text-xs text-[var(--text-color-secondary)]">
          Allowed: {allowedTypes.split(',').join(', ')} {multiple ? '(multiple)' : '(single)'}
        </span>
      </div>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept={allowedTypes.split(',').map(t => `.${t.trim()}`).join(',')}
        multiple={multiple}
        onChange={handleInputChange}
        className="hidden"
      />

      {/* File list */}
      {showFileList && files.length > 0 && (
        <TpsFileList files={files} onDelete={onDelete} />
      )}
    </div>
  );
}
