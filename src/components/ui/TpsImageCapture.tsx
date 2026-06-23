import { Loader2 } from '@/constants/icons';
import { Camera, Upload, RefreshCw, X } from 'lucide-react';
import { useState, useCallback } from 'react';
import { Button, Image } from '@/components/primitives';
import { TpsFileUpload } from './TpsFileUpload';

// ── Types ────────────────────────────────────────────────────────────────────

type CaptureSource = 'camera' | 'upload';

export interface TpsImageCaptureProps {
  sources?: CaptureSource[];
  cameraUid?: string;
  cameraName?: string;
  onFetchFrame?: (camUid: string) => Promise<string>;
  onCapture: (imageUrl: string, file?: File) => void;
  previewUrl?: string;
  uploadLabel?: string;
  allowedTypes?: string;
  loading?: boolean;
}

// ── Component ────────────────────────────────────────────────────────────────

export function TpsImageCapture({
  sources = ['camera', 'upload'],
  cameraUid,
  cameraName,
  onFetchFrame,
  onCapture,
  previewUrl,
  uploadLabel = 'Drop image here (PNG, JPG, JPEG)',
  allowedTypes = 'png,jpg,jpeg',
  loading = false,
}: TpsImageCaptureProps) {
  const [activeSource, setActiveSource] = useState<CaptureSource>(sources[0]);
  const [fetching, setFetching] = useState(false);
  const [hovered, setHovered] = useState(false);

  const handleFetchFrame = useCallback(async () => {
    if (!cameraUid || !onFetchFrame) return;
    setFetching(true);
    try {
      const url = await onFetchFrame(cameraUid);
      onCapture(url);
    } finally {
      setFetching(false);
    }
  }, [cameraUid, onFetchFrame, onCapture]);

  const handleFileUpload = useCallback((files: { file: File }[]) => {
    if (files[0]) {
      const url = URL.createObjectURL(files[0].file);
      onCapture(url, files[0].file);
    }
  }, [onCapture]);

  const handleClear = useCallback(() => {
    onCapture('');
  }, [onCapture]);

  // ── Preview mode — image captured/uploaded ────────────────────────────────
  if (previewUrl) {
    return (
      <div className="flex flex-col gap-3 items-center w-full">
        {/* Image card with hover overlay */}
        <div
          className="relative rounded-2xl overflow-hidden cursor-pointer"
          style={{
            width: '100%',
            maxWidth: 400,
            border: '1px solid var(--color-divider)',
            background: 'var(--color-surface-dim)',
          }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          {/* preview=true enables click-to-fullscreen via Image primitive */}
          <Image
            src={previewUrl}
            alt="Captured"
            width="100%"
            height={240}
            fit="cover"
            radius="none"
            preview
          />

          {/* Hover overlay */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 transition-opacity duration-200"
            style={{
              background: 'rgba(0,0,0,0.55)',
              opacity: hovered ? 1 : 0,
              backdropFilter: 'blur(2px)',
              pointerEvents: hovered ? 'auto' : 'none',
            }}
          >
            <p className="text-white text-xs font-medium tracking-wide uppercase opacity-80">Image Captured</p>
            <div className="flex gap-2">
              <button
                onClick={handleClear}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border-none cursor-pointer transition-colors"
                style={{ background: 'rgba(255,255,255,0.15)', color: 'white' }}
              >
                <X size={12} strokeWidth={2.5} /> Remove
              </button>
              {activeSource === 'camera' && (
                <button
                  onClick={handleFetchFrame}
                  disabled={fetching}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border-none cursor-pointer transition-colors"
                  style={{ background: 'rgba(255,255,255,0.15)', color: 'white' }}
                >
                  <RefreshCw size={12} strokeWidth={2.5} /> Re-take
                </button>
              )}
            </div>
          </div>

          {/* Success badge */}
          {!hovered && (
            <div
              className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold"
              style={{ background: 'var(--color-success)', color: 'white', pointerEvents: 'none' }}
            >
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                <path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Captured
            </div>
          )}
        </div>

        {/* Change source buttons */}
        <div className="flex gap-2">
          {sources.length > 1 && sources.map((src) => (
            <Button
              key={src}
              variant="secondary"
              size="sm"
              leftIcon={src === 'camera' ? <Camera size={13} strokeWidth={2} /> : <Upload size={13} strokeWidth={2} />}
              onClick={() => { setActiveSource(src); handleClear(); }}
            >
              {src === 'camera' ? 'Use Camera' : 'Upload New'}
            </Button>
          ))}
          {sources.length === 1 && (
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<RefreshCw size={13} strokeWidth={2} />}
              onClick={handleClear}
            >
              Change Image
            </Button>
          )}
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
            <Loader2 className="animate-spin" size={16} />
            <span>Processing…</span>
          </div>
        )}
      </div>
    );
  }

  // ── Capture mode ──────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4 items-center w-full">
      {/* Source toggle */}
      {sources.length > 1 && (
        <div className="flex gap-2 justify-center">
          {sources.includes('camera') && (
            <Button
              variant={activeSource === 'camera' ? 'primary' : 'secondary'}
              size="sm"
              leftIcon={<Camera size={13} strokeWidth={2} />}
              onClick={() => setActiveSource('camera')}
            >
              Camera Image
            </Button>
          )}
          {sources.includes('upload') && (
            <Button
              variant={activeSource === 'upload' ? 'primary' : 'secondary'}
              size="sm"
              leftIcon={<Upload size={13} strokeWidth={2} />}
              onClick={() => setActiveSource('upload')}
            >
              Upload Picture
            </Button>
          )}
        </div>
      )}

      {/* Camera source */}
      {activeSource === 'camera' && (
        <div className="flex flex-col gap-3 items-center">
          {cameraName && (
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Camera: <span className="font-medium" style={{ color: 'var(--color-text)' }}>{cameraName}</span>
            </p>
          )}
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<i className={`pi ${fetching ? 'pi-spin pi-spinner' : 'pi-camera'}`} style={{ fontSize: '0.85rem' }} />}
            onClick={handleFetchFrame}
            disabled={!cameraUid || fetching}
          >
            {fetching ? 'Fetching…' : 'Fetch Image'}
          </Button>
        </div>
      )}

      {/* Upload source */}
      {activeSource === 'upload' && (
        <div className="w-full" style={{ maxWidth: 400 }}>
          <TpsFileUpload
            allowedTypes={allowedTypes}
            multiple={false}
            label={uploadLabel}
            files={[]}
            onUpload={handleFileUpload}
            onDelete={() => onCapture('')}
          />
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
          <Loader2 className="animate-spin" size={16} />
          <span>Processing…</span>
        </div>
      )}
    </div>
  );
}
