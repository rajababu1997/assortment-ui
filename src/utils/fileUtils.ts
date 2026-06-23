/**
 * File utility functions — ported from Angular CommonService file methods.
 *
 * Covers: type detection, icon mapping, size formatting, MIME validation,
 * base64 conversions, and allowed file type checks.
 */

import { FileText, Image, Paperclip, type LucideIcon } from '@/constants/icons';

// ── File type & icon detection ───────────────────────────────────────────────

export type FileCategory = 'pdf' | 'image' | 'file';

const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg']);
const PDF_EXTENSIONS = new Set(['pdf']);

/** Detect file category from filename extension */
export function getFileCategory(fileName?: string): FileCategory {
  const ext = fileName?.split('.').pop()?.toLowerCase() ?? '';
  if (PDF_EXTENSIONS.has(ext)) return 'pdf';
  if (IMAGE_EXTENSIONS.has(ext)) return 'image';
  return 'file';
}

/** Map file category to Lucide icon component */
export function getFileIcon(fileName?: string): LucideIcon {
  const cat = getFileCategory(fileName);
  switch (cat) {
    case 'pdf':   return FileText;
    case 'image': return Image;
    default:      return Paperclip;
  }
}

/** Check if file is an image */
export function isImageFile(fileName?: string): boolean {
  return getFileCategory(fileName) === 'image';
}

// ── File size formatting ─────────────────────────────────────────────────────

const SIZE_UNITS = ['Bytes', 'KB', 'MB', 'GB', 'TB'] as const;

/** Format bytes to human-readable size string (e.g., "1.5 MB") */
export function formatFileSize(bytes?: number): string {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const size = parseFloat((bytes / Math.pow(k, i)).toFixed(2));
  return `${size} ${SIZE_UNITS[i] ?? 'Bytes'}`;
}

// ── File type validation ─────────────────────────────────────────────────────

const DEFAULT_ALLOWED_TYPES = new Set(['pdf', 'jpg', 'jpeg', 'png']);
const DEFAULT_ALLOWED_MIMES = new Set([
  'image/jpeg', 'image/png', 'image/jpg', 'application/pdf',
]);

/** Check if filename has an allowed extension */
export function isFileAllowed(fileName: string, allowedTypes?: string): boolean {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';

  if (allowedTypes) {
    // Parse "pdf,jpg,jpeg,png" or "*.pdf,*.jpg" formats
    const allowed = new Set(
      allowedTypes.split(',').map(t => t.trim().replace('*.', '').toLowerCase())
    );
    return allowed.has(ext);
  }

  return DEFAULT_ALLOWED_TYPES.has(ext);
}

/** Check if MIME type is allowed */
export function isAllowedMimeType(type: string): boolean {
  return DEFAULT_ALLOWED_MIMES.has(type);
}

// ── Base64 / Blob conversions ────────────────────────────────────────────────

/** Convert base64 string to Blob */
export function base64ToBlob(b64Data: string, contentType = 'application/octet-stream'): Blob {
  // Strip data URL prefix if present
  const base64 = b64Data.includes(',') ? b64Data.split(',')[1] : b64Data;
  const byteChars = atob(base64);
  const byteArrays: Uint8Array[] = [];

  for (let offset = 0; offset < byteChars.length; offset += 512) {
    const slice = byteChars.slice(offset, offset + 512);
    const bytes = new Uint8Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      bytes[i] = slice.charCodeAt(i);
    }
    byteArrays.push(bytes);
  }

  return new Blob(byteArrays, { type: contentType });
}

/** Convert base64 string to PNG File object */
export function base64ToPngFile(base64String: string, name: string): File {
  const blob = base64ToBlob(base64String, 'image/png');
  return new File([blob], `${name}.png`, { type: 'image/png' });
}

/** Convert data URL to File object */
export function dataUrlToFile(dataUrl: string, filename: string): File {
  const [header, data] = dataUrl.split(',');
  const mime = header.match(/:(.*?);/)?.[1] ?? 'application/octet-stream';
  const bytes = atob(data);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    arr[i] = bytes.charCodeAt(i);
  }
  return new File([arr], filename, { type: mime });
}

/** Read a File as base64 data URL */
export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ── File metadata enrichment ─────────────────────────────────────────────────

export interface EnrichedFile {
  file: File;
  name: string;
  size: string;
  sizeBytes: number;
  modifiedOn: string;
  src?: string;
  category: FileCategory;
  icon: LucideIcon;
  uuid?: string;
}

/** Enrich a File object with display metadata */
export async function enrichFile(file: File): Promise<EnrichedFile> {
  const category = getFileCategory(file.name);
  const src = category === 'image' ? await readFileAsDataUrl(file) : undefined;

  return {
    file,
    name: file.name,
    size: formatFileSize(file.size),
    sizeBytes: file.size,
    modifiedOn: new Date(file.lastModified).toLocaleString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true,
    }),
    src,
    category,
    icon: getFileIcon(file.name),
  };
}
