import type { ReactNode } from 'react';

export interface GalleryItem {
  /** Full-size image URL. */
  src: string;
  /** Thumbnail URL (defaults to `src`). */
  thumbnail?: string;
  /** Alt text for both main and thumb. */
  alt: string;
  /** Arbitrary payload — passed to optional renderers. */
  meta?: Record<string, any>;
}

export interface GalleryProps {
  items: GalleryItem[];
  /** Controlled active index. If omitted, component is uncontrolled starting at 0. */
  activeIndex?: number;
  onActiveIndexChange?: (index: number) => void;
  /** Thumbnail strip position. Default `left`. */
  thumbnailsPosition?: 'left' | 'right' | 'top' | 'bottom' | 'none';
  /** Number of visible thumbnails in the strip. Default 5. */
  numVisible?: number;
  /** Render an alternate main cell. Receives current item + index. */
  renderItem?: (item: GalleryItem, index: number) => ReactNode;
  /** Render an alternate thumbnail cell. */
  renderThumbnail?: (item: GalleryItem, index: number) => ReactNode;
  /** Show prev/next arrow buttons. Default true. */
  showArrows?: boolean;
  /** Container class. */
  className?: string;
}
