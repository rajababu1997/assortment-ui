import { useCallback, useEffect, useId, useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import clsx from 'clsx';
import { File as FileIcon, Pencil, RotateCcw, UploadCloud, X } from 'lucide-react';
import styles from './FileUpload.module.css';
import type { FileUploadProps } from './FileUpload.types';

export function FileUpload({
  value,
  onChange,
  label,
  accept,
  maxSize,
  preview,
  previewUrl,
  previewLoading = false,
  disabled = false,
  required = false,
  error,
  hint,
  previewHeight = 160,
  className,
}: FileUploadProps) {
  const reactId = useId();
  const inputId = `file-${reactId}`;
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const [previewCleared, setPreviewCleared] = useState(false);

  const showImagePreview = preview ?? (accept ?? '').includes('image');

  // Generate blob URL from selected file
  useEffect(() => {
    if (!value || !showImagePreview) {
      setLocalPreviewUrl(null);
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setLocalPreviewUrl(reader.result as string);
    reader.readAsDataURL(value);
    return () => {
      reader.abort();
    };
  }, [value, showImagePreview]);

  // Reset cleared flag when a different record is opened (new previewUrl)
  useEffect(() => {
    setPreviewCleared(false);
  }, [previewUrl]);

  const effectiveImageUrl = localPreviewUrl ?? (previewCleared ? null : previewUrl) ?? null;
  const hasAnyPreview = value || effectiveImageUrl;
  // Show revert only when a new file is staged and there is an original server image to go back to
  const canRevert = !!value && !!previewUrl && !previewCleared;

  const processFile = useCallback(
    (file: File | null) => {
      if (!file) {
        onChange(null);
        return;
      }
      if (maxSize && file.size > maxSize) return;
      onChange(file);
    },
    [onChange, maxSize]
  );

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    processFile(e.target.files?.[0] ?? null);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleRemove = () => {
    onChange(null);
    setPreviewCleared(true);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleRevert = () => {
    onChange(null);
    setPreviewCleared(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  const openPicker = () => {
    if (disabled) return;
    inputRef.current?.click();
  };

  return (
    <div className={clsx(styles.root, className)}>
      {label && (
        <label htmlFor={inputId} className={styles.label}>
          {label}
          {required && (
            <span className={styles.required} aria-hidden>
              *
            </span>
          )}
        </label>
      )}

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={accept}
        disabled={disabled}
        onChange={handleInputChange}
        className={styles.fileInput}
        aria-invalid={!!error}
      />

      {/* Skeleton while external preview is loading */}
      {previewLoading && !effectiveImageUrl && (
        <div className={styles.skeleton} style={{ height: previewHeight }} aria-label="Loading preview" />
      )}

      {/* Drop zone — hidden while loading or when a preview is present */}
      {!hasAnyPreview && !previewLoading && (
        <div
          className={clsx(
            styles.dropZone,
            disabled && styles.disabled,
            isDragging && styles.dropZoneActive,
            error && styles.dropZoneError
          )}
          onClick={openPicker}
          onDragEnter={(e) => {
            e.preventDefault();
            if (!disabled) setIsDragging(true);
          }}
          onDragOver={(e) => e.preventDefault()}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          role="button"
          tabIndex={disabled ? -1 : 0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              openPicker();
            }
          }}
          style={{ minHeight: previewHeight }}
        >
          <UploadCloud size={28} className={styles.icon} strokeWidth={1.5} />
          <div className={styles.primaryText}>
            <span className={styles.accent}>Click to upload</span>
            <span> or drag and drop</span>
          </div>
          {hint && <div className={styles.hint}>{hint}</div>}
        </div>
      )}

      {/* Image preview */}
      {hasAnyPreview && showImagePreview && effectiveImageUrl && (
        <div className={styles.preview} style={{ height: previewHeight }}>
          <img src={effectiveImageUrl} alt={value?.name ?? 'Preview'} className={styles.previewImage} />

          {/* "New" badge when a local file is staged but not yet saved */}
          {!!value && <span className={styles.newBadge}>New</span>}

          {!disabled && (
            <div className={styles.previewActions}>
              <button
                type="button"
                onClick={openPicker}
                className={styles.actionBtn}
                aria-label="Replace file"
                title="Replace"
              >
                <Pencil size={15} />
              </button>
              {canRevert && (
                <button
                  type="button"
                  onClick={handleRevert}
                  className={clsx(styles.actionBtn, styles.actionBtnRevert)}
                  aria-label="Revert to saved photo"
                  title="Revert to saved"
                >
                  <RotateCcw size={15} />
                </button>
              )}
              <button
                type="button"
                onClick={handleRemove}
                className={clsx(styles.actionBtn, styles.actionBtnDanger)}
                aria-label="Remove file"
                title="Remove"
              >
                <X size={15} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Non-image file pill */}
      {hasAnyPreview && !showImagePreview && value && (
        <div className={styles.filePill}>
          <span className={styles.fileIcon}>
            <FileIcon size={18} />
          </span>
          <div className={styles.fileInfo}>
            <span className={styles.fileName}>{value.name}</span>
            <span className={styles.fileMeta}>{formatBytes(value.size)}</span>
          </div>
          {!disabled && (
            <button type="button" onClick={handleRemove} className={styles.removeBtn} aria-label="Remove file">
              <X size={16} />
            </button>
          )}
        </div>
      )}

      {error && (
        <span className={styles.errorMessage} role="alert">
          {error}
        </span>
      )}
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
