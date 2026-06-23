export interface FileUploadProps {
  /** Current file (null when nothing selected). */
  value: File | null;
  /** Callback when file changes. Null means cleared. */
  onChange: (_file: File | null) => void;
  label?: string;
  /** Accept filter, e.g. "image/*" or ".pdf,.docx". */
  accept?: string;
  /** Maximum file size in bytes. */
  maxSize?: number;
  /** Show a thumbnail preview for image files. Default: true when accept includes image. */
  preview?: boolean;
  /** External preview URL — shown when no new file is selected (e.g., existing server image). */
  previewUrl?: string | null;
  /** Show a loading skeleton while the external preview is being fetched. */
  previewLoading?: boolean;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  /** Hint text shown in the drop zone. */
  hint?: string;
  /** Height of the preview area in px. Default: 160. */
  previewHeight?: number;
  className?: string;
}
