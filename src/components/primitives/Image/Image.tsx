import { useEffect, useCallback, useState, useRef, type MouseEvent as ReactMouseEvent } from 'react';
import { createPortal } from 'react-dom';
import { ZoomIn, ZoomOut, RotateCcw, RotateCw, X, Maximize2 } from 'lucide-react';
import clsx from 'clsx';
import styles from './Image.module.css';
import type { ImageProps } from './Image.types';

// ── Zoom constants ────────────────────────────────────────────────────────────
const ZOOM_STEP = 0.25;
const ZOOM_WHEEL_STEP = 0.1;
const ZOOM_MIN = 0.2;
const ZOOM_MAX = 5;
const clampZoom = (v: number) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(v * 100) / 100));

// ── Fit / radius maps ─────────────────────────────────────────────────────────
const fitClass = {
  cover: styles.fitCover,
  contain: styles.fitContain,
  fill: styles.fitFill,
  none: styles.fitNone,
  'scale-down': styles.fitScaleDown,
};

const radiusClass = {
  none: styles.radiusNone,
  sm: styles.radiusSm,
  md: styles.radiusMd,
  lg: styles.radiusLg,
  full: styles.radiusFull,
};

// ── Component ─────────────────────────────────────────────────────────────────

export function Image({
  src,
  alt,
  width,
  height,
  fit = 'cover',
  preview = false,
  radius = 'md',
  fallbackSrc,
  loadingPlaceholder = 'skeleton',
  className,
  style,
  imgClassName,
  onClick,
  onError,
}: ImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);
  const [previewOpen, setPreviewOpen] = useState(false);

  // ── Viewer state ──────────────────────────────────────────────────────────
  const [zoom, setZoom] = useState(1);
  const [rotate, setRotate] = useState(0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const previewRef = useRef<HTMLDivElement>(null);
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });
  const panPos = useRef({ x: 0, y: 0 }); // mirrors pan state without stale closure

  useEffect(() => {
    setLoaded(false);
    setErrored(false);
    setCurrentSrc(src);
  }, [src]);

  // ── Actions (stable refs — useCallback with [] since all use functional setState) ──
  const zoomIn = useCallback(() => setZoom((p) => clampZoom(p + ZOOM_STEP)), []);
  const zoomOut = useCallback(() => setZoom((p) => clampZoom(p - ZOOM_STEP)), []);
  const rotateLeft = useCallback(() => setRotate((p) => p - 90), []);
  const rotateRight = useCallback(() => setRotate((p) => p + 90), []);
  const resetTransform = useCallback(() => {
    setZoom(1);
    setRotate(0);
    setPan({ x: 0, y: 0 });
    panPos.current = { x: 0, y: 0 };
  }, []);

  // Reset viewer state whenever preview opens
  useEffect(() => {
    if (previewOpen) resetTransform();
  }, [previewOpen, resetTransform]);

  // Keyboard shortcuts + scroll-wheel zoom — single effect, stable deps
  useEffect(() => {
    if (!previewOpen) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPreviewOpen(false);
      else if (e.key === '+' || e.key === '=') zoomIn();
      else if (e.key === '-') zoomOut();
      else if (e.key === '[') rotateLeft();
      else if (e.key === ']') rotateRight();
      else if (e.key === '0') resetTransform();
    };

    const el = previewRef.current;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setZoom((p) => clampZoom(p + (e.deltaY < 0 ? ZOOM_WHEEL_STEP : -ZOOM_WHEEL_STEP)));
    };

    document.addEventListener('keydown', onKey);
    el?.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      document.removeEventListener('keydown', onKey);
      el?.removeEventListener('wheel', onWheel);
    };
  }, [previewOpen, zoomIn, zoomOut, rotateLeft, rotateRight, resetTransform]);

  // ── Drag-to-pan ───────────────────────────────────────────────────────────
  const handleImgMouseDown = useCallback(
    (e: ReactMouseEvent<HTMLImageElement>) => {
      e.stopPropagation(); // don't close backdrop on mousedown
      if (zoom <= 1) return;
      isPanning.current = true;
      panStart.current = { x: e.clientX - panPos.current.x, y: e.clientY - panPos.current.y };
    },
    [zoom]
  );

  const handleBackdropMouseMove = useCallback((e: ReactMouseEvent) => {
    if (!isPanning.current) return;
    const next = { x: e.clientX - panStart.current.x, y: e.clientY - panStart.current.y };
    panPos.current = next;
    setPan(next);
  }, []);

  const stopPan = useCallback(() => {
    isPanning.current = false;
  }, []);

  // ── Thumbnail load handling ───────────────────────────────────────────────
  const handleError = useCallback(() => {
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      return;
    }
    setErrored(true);
    onError?.();
  }, [fallbackSrc, currentSrc, onError]);

  const handleClick = () => {
    if (preview) setPreviewOpen(true);
    else onClick?.();
  };

  const showSkeleton = !loaded && !errored && loadingPlaceholder === 'skeleton';

  // Ref callback: if the browser already decoded the image (data URLs, cached HTTP images)
  // before React attached onLoad, the event never fires. Checking `.complete` on mount
  // handles this race condition for both data: URLs and cached network images.
  const imgRef = useCallback(
    (el: HTMLImageElement | null) => {
      if (el?.complete && !el.naturalWidth) {
        handleError();
      } else if (el?.complete) {
        setLoaded(true);
      }
    },
    [handleError]
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <div
        className={clsx(styles.container, radiusClass[radius], (preview || onClick) && styles.previewable, className)}
        style={{ width, height, ...style }}
        onClick={handleClick}
      >
        {showSkeleton && <div className={styles.skeleton} aria-hidden="true" />}
        {errored ? (
          <div className={styles.errorState}>
            <span aria-label="Image failed to load">Image unavailable</span>
          </div>
        ) : (
          <img
            ref={imgRef}
            src={currentSrc}
            alt={alt}
            className={clsx(styles.img, fitClass[fit], imgClassName)}
            onLoad={() => setLoaded(true)}
            onError={handleError}
            draggable={false}
          />
        )}
      </div>

      {preview &&
        previewOpen &&
        createPortal(
          <div
            ref={previewRef}
            className={styles.previewBackdrop}
            onClick={() => setPreviewOpen(false)}
            onMouseMove={handleBackdropMouseMove}
            onMouseUp={stopPan}
            onMouseLeave={stopPan}
            role="dialog"
            aria-modal="true"
            aria-label={alt}
          >
            <img
              src={currentSrc}
              alt={alt}
              className={styles.previewImg}
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotate}deg)`,
                cursor: zoom > 1 ? 'grab' : 'default',
              }}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={handleImgMouseDown}
              draggable={false}
            />

            {/* Toolbar */}
            <div className={styles.previewToolbar} onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className={styles.toolbarBtn}
                onClick={zoomOut}
                aria-label="Zoom out"
                aria-disabled={zoom <= ZOOM_MIN}
                title="Zoom out (-)"
              >
                <ZoomOut size={17} strokeWidth={1.75} />
              </button>

              <span className={styles.zoomLabel}>{Math.round(zoom * 100)}%</span>

              <button
                type="button"
                className={styles.toolbarBtn}
                onClick={zoomIn}
                aria-label="Zoom in"
                aria-disabled={zoom >= ZOOM_MAX}
                title="Zoom in (+)"
              >
                <ZoomIn size={17} strokeWidth={1.75} />
              </button>

              <div className={styles.toolbarDivider} />

              <button
                type="button"
                className={styles.toolbarBtn}
                onClick={rotateLeft}
                aria-label="Rotate left"
                title="Rotate left ([)"
              >
                <RotateCcw size={17} strokeWidth={1.75} />
              </button>

              <button
                type="button"
                className={styles.toolbarBtn}
                onClick={rotateRight}
                aria-label="Rotate right"
                title="Rotate right (])"
              >
                <RotateCw size={17} strokeWidth={1.75} />
              </button>

              <div className={styles.toolbarDivider} />

              <button
                type="button"
                className={styles.toolbarBtn}
                onClick={resetTransform}
                aria-label="Reset view"
                title="Reset (0)"
              >
                <Maximize2 size={15} strokeWidth={1.75} />
              </button>
            </div>

            {/* Close */}
            <button
              type="button"
              className={styles.previewClose}
              onClick={() => setPreviewOpen(false)}
              aria-label="Close preview"
            >
              <X size={16} strokeWidth={2} />
            </button>
          </div>,
          document.body
        )}
    </>
  );
}
