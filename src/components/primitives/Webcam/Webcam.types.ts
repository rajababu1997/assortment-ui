import type { ReactNode } from 'react';

export type WebcamFacingMode = 'user' | 'environment';

export interface WebcamCaptureResult {
  /** Captured image as a Blob (image/jpeg by default). */
  blob: Blob;
  /** Captured image as a File (named `capture-<timestamp>.jpg`). */
  file: File;
  /** Data-URL for immediate preview (same encoding as blob). */
  dataUrl: string;
  /** Capture dimensions in pixels. */
  width: number;
  height: number;
}

export interface WebcamProps {
  /** Called when the user captures a frame via the capture button or `capture()` ref method. */
  onCapture?: (result: WebcamCaptureResult) => void;
  /** Fires when the webcam is ready (stream is playing). */
  onReady?: () => void;
  /** Fires on getUserMedia error — permission denied, no device, etc. */
  onError?: (error: Error) => void;

  /** Preferred facing camera. Default 'user' (front). */
  facingMode?: WebcamFacingMode;
  /** Requested ideal resolution. Browser may pick a close match. */
  width?: number;
  height?: number;
  /** Auto-start the stream when the component mounts. Default true. */
  autoStart?: boolean;
  /** Hide the built-in capture button (e.g. if the parent provides its own via ref). */
  hideCaptureButton?: boolean;
  /** Mirror the video horizontally (common for front camera). Default: true when facingMode='user'. */
  mirror?: boolean;
  /** Mime type for captured image. Default 'image/jpeg'. */
  captureMimeType?: 'image/jpeg' | 'image/png' | 'image/webp';
  /** JPEG/WebP quality 0–1. Default 0.92. */
  captureQuality?: number;

  /** Aspect ratio for the video container (e.g. '16 / 9', '4 / 3', '1 / 1'). Default '4 / 3'. */
  aspectRatio?: string;
  /** Overlay content rendered on top of the video (e.g., crosshair, face-detection box). */
  overlay?: ReactNode;

  /** Customize the built-in capture button label. */
  captureLabel?: string;
  className?: string;
}

export interface WebcamRef {
  /** Programmatically capture the current frame. */
  capture: () => WebcamCaptureResult | null;
  /** Start the stream (no-op if already running). */
  start: () => Promise<void>;
  /** Stop and release the stream. */
  stop: () => void;
  /** Swap between 'user' and 'environment' facing camera. */
  switchCamera: () => Promise<void>;
  /** List available video input devices (requires permission granted). */
  listDevices: () => Promise<MediaDeviceInfo[]>;
  /** Is the stream currently playing? */
  isReady: () => boolean;
}
