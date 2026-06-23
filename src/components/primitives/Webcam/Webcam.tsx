import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import clsx from 'clsx';
import { Camera, RefreshCw, VideoOff } from 'lucide-react';
import styles from './Webcam.module.css';
import type { WebcamCaptureResult, WebcamProps, WebcamRef } from './Webcam.types';

export const Webcam = forwardRef<WebcamRef, WebcamProps>(function Webcam(
  {
    onCapture,
    onReady,
    onError,
    facingMode = 'user',
    width = 1280,
    height = 720,
    autoStart = true,
    hideCaptureButton = false,
    mirror,
    captureMimeType = 'image/jpeg',
    captureQuality = 0.92,
    aspectRatio = '4 / 3',
    overlay,
    captureLabel = 'Capture',
    className,
  },
  ref,
) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [currentFacing, setCurrentFacing] = useState(facingMode);
  const [status, setStatus] = useState<'idle' | 'starting' | 'ready' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const shouldMirror = mirror ?? currentFacing === 'user';

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const startStream = useCallback(
    async (facing: 'user' | 'environment' = currentFacing) => {
      if (streamRef.current) stopStream();
      setStatus('starting');
      setErrorMsg('');
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error('Camera API not available in this browser.');
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facing },
            width: { ideal: width },
            height: { ideal: height },
          },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setStatus('ready');
        onReady?.();
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to start camera.';
        setErrorMsg(msg);
        setStatus('error');
        onError?.(err instanceof Error ? err : new Error(msg));
      }
    },
    [currentFacing, width, height, onReady, onError, stopStream],
  );

  const doCapture = useCallback((): WebcamCaptureResult | null => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || status !== 'ready') return null;

    const w = video.videoWidth;
    const h = video.videoHeight;
    if (!w || !h) return null;

    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    if (shouldMirror) {
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, w, h);
    if (shouldMirror) ctx.setTransform(1, 0, 0, 1, 0, 0);

    const dataUrl = canvas.toDataURL(captureMimeType, captureQuality);
    const blob = dataURLToBlob(dataUrl);
    const ext = captureMimeType.split('/')[1] ?? 'jpg';
    const file = new File([blob], `capture-${Date.now()}.${ext}`, { type: captureMimeType });
    return { blob, file, dataUrl, width: w, height: h };
  }, [status, shouldMirror, captureMimeType, captureQuality]);

  const switchCamera = useCallback(async () => {
    const next = currentFacing === 'user' ? 'environment' : 'user';
    setCurrentFacing(next);
    await startStream(next);
  }, [currentFacing, startStream]);

  const listDevices = useCallback(async (): Promise<MediaDeviceInfo[]> => {
    if (!navigator.mediaDevices?.enumerateDevices) return [];
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter((d) => d.kind === 'videoinput');
  }, []);

  // Mount / unmount lifecycle
  useEffect(() => {
    if (autoStart) startStream(facingMode);
    return () => stopStream();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Imperative handle for parents
  useImperativeHandle(
    ref,
    () => ({
      capture: () => {
        const result = doCapture();
        if (result && onCapture) onCapture(result);
        return result;
      },
      start: () => startStream(),
      stop: stopStream,
      switchCamera,
      listDevices,
      isReady: () => status === 'ready',
    }),
    [doCapture, startStream, stopStream, switchCamera, listDevices, status, onCapture],
  );

  const handleCaptureClick = () => {
    const result = doCapture();
    if (result && onCapture) onCapture(result);
  };

  return (
    <div className={clsx(styles.root, className)}>
      <div className={styles.stage} style={{ aspectRatio }}>
        <video
          ref={videoRef}
          className={clsx(styles.video, shouldMirror && styles.mirrored)}
          playsInline
          autoPlay
          muted
        />
        {overlay && <div className={styles.overlay}>{overlay}</div>}

        {status === 'starting' && (
          <div className={styles.statusOverlay} role="status">
            <RefreshCw size={28} className={styles.statusIcon} />
            <span className={styles.statusText}>Starting camera…</span>
          </div>
        )}
        {status === 'error' && (
          <div className={styles.statusOverlay} role="alert">
            <VideoOff size={28} className={styles.statusIcon} />
            <span className={styles.statusText}>Camera unavailable</span>
            <span className={styles.statusSub}>{errorMsg}</span>
            <button type="button" onClick={() => startStream()} className={styles.secondaryBtn}
              style={{ width: 'auto', height: 'auto', padding: '6px 12px', borderRadius: 'var(--radius-md)' }}>
              Retry
            </button>
          </div>
        )}
      </div>

      <div className={styles.controls}>
        <button
          type="button"
          onClick={switchCamera}
          disabled={status !== 'ready'}
          className={styles.secondaryBtn}
          aria-label="Switch camera"
          title="Switch camera"
        >
          <RefreshCw size={18} />
        </button>

        {!hideCaptureButton && (
          <button
            type="button"
            onClick={handleCaptureClick}
            disabled={status !== 'ready'}
            className={styles.captureBtn}
            aria-label={captureLabel}
            title={captureLabel}
          />
        )}

        <button
          type="button"
          onClick={stopStream}
          disabled={status !== 'ready'}
          className={styles.secondaryBtn}
          aria-label="Stop camera"
          title="Stop camera"
        >
          <Camera size={18} />
        </button>
      </div>

      <canvas ref={canvasRef} className={styles.canvas} aria-hidden />
    </div>
  );
});

// ── Helpers ──────────────────────────────────────────────────────────────────

function dataURLToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(',');
  const mime = /:(.*?);/.exec(header)?.[1] ?? 'image/jpeg';
  const bin = atob(base64);
  const len = bin.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}
