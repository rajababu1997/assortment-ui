import { useState, useCallback, useEffect } from 'react';
import { Dialog } from '@/components/primitives';

export interface ImageViewerDialogProps {
  visible: boolean;
  onHide: () => void;
  src?: string;
  title?: string;
  alt?: string;
}

export function ImageViewerDialog({
  visible,
  onHide,
  src,
  title = 'Image Preview',
  alt = 'Image',
}: ImageViewerDialogProps) {
  const [hasError, setHasError] = useState(false);

  const handleError = useCallback(() => setHasError(true), []);

  useEffect(() => {
    if (visible) setHasError(false);
  }, [visible, src]);

  return (
    <Dialog
      open={visible}
      onClose={onHide}
      title={title}
      size="lg"
      closeOnBackdrop
    >
      <div className="flex items-center justify-center min-h-[300px]">
        {src && !hasError ? (
          <img
            src={src}
            alt={alt}
            onError={handleError}
            style={{
              maxWidth: '100%',
              maxHeight: '60vh',
              objectFit: 'contain',
              borderRadius: 6,
            }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 p-8 text-center">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center shadow-inner"
              style={{ background: 'var(--color-surface-alt)' }}
            >
              <i
                className={`pi ${hasError ? 'pi-exclamation-triangle' : 'pi-camera'}`}
                style={{ fontSize: '1.5rem', color: 'var(--color-text-secondary)' }}
              />
            </div>
            <p style={{ color: 'var(--color-text)', fontWeight: 600 }}>
              {hasError ? 'Failed to Load Image' : 'No Image Available'}
            </p>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
              {hasError ? 'The image could not be loaded. It may have been removed or the URL is invalid.' : 'Image will appear here when available'}
            </p>
          </div>
        )}
      </div>
    </Dialog>
  );
}
