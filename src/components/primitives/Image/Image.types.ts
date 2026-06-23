import type { CSSProperties } from 'react';

export interface ImageProps {
  /** Image URL. */
  src: string;
  /** Alt text (required for a11y). */
  alt: string;
  /** Fixed width (px). */
  width?: number | string;
  /** Fixed height (px). */
  height?: number | string;
  /** object-fit mode. Default `cover`. */
  fit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  /** Enable click-to-preview modal. Default false. */
  preview?: boolean;
  /** Round corners via radius token name. Default `md`. */
  radius?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  /** Fallback src when the primary image fails to load. */
  fallbackSrc?: string;
  /** Render while loading. Default: Skeleton. Pass null to disable. */
  loadingPlaceholder?: 'skeleton' | 'none';
  /** Extra class on the container. */
  className?: string;
  /** Extra style on the container. */
  style?: CSSProperties;
  /** Extra class on the <img>. */
  imgClassName?: string;
  /** Click handler on the image (ignored when preview=true). */
  onClick?: () => void;
  /** Fired when the primary src (and `fallbackSrc` if any) both fail to load. */
  onError?: () => void;
}
