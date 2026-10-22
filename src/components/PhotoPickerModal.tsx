import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Modal } from './Modal';
import { CameraIcon, TrashIcon, UploadIcon } from './Icons';

interface PhotoPickerModalProps {
  open: boolean;
  onClose: () => void;
  previewUrl: string | null;
  hasPhoto: boolean;
  onSave: (file: Blob) => Promise<void>;
  onRemove: () => Promise<void>;
}

export function PhotoPickerModal({
  open,
  onClose,
  previewUrl,
  hasPhoto,
  onSave,
  onRemove,
}: PhotoPickerModalProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const captureInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [coarsePointer] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(pointer: coarse)').matches;
  });

  const cameraSupported =
    typeof navigator !== 'undefined' &&
    (coarsePointer || Boolean(navigator.mediaDevices?.getUserMedia));

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraOpen(false);
  }, []);

  useEffect(() => {
    if (!open) {
      stopCamera();
      setError(null);
      setBusy(false);
    }
  }, [open, stopCamera]);

  useEffect(() => () => stopCamera(), [stopCamera]);

  useEffect(() => {
    if (!open || !cameraOpen) return;
    let alive = true;

    void (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        });
        if (!alive) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => undefined);
        }
      } catch {
        if (alive) {
          setError('Camera access was blocked. You can upload a photo instead.');
          setCameraOpen(false);
        }
      }
    })();

    return () => {
      alive = false;
      stopCamera();
    };
  }, [open, cameraOpen, stopCamera]);

  const handleSave = async (file: Blob) => {
    setBusy(true);
    setError(null);
    try {
      await onSave(file);
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'That photo could not be saved.');
    } finally {
      setBusy(false);
    }
  };

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.target;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    await handleSave(file);
  };

  const handleRemove = async () => {
    setBusy(true);
    setError(null);
    try {
      await onRemove();
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'That photo could not be removed.');
    } finally {
      setBusy(false);
    }
  };

  const startCamera = () => {
    setError(null);
    if (coarsePointer) {
      captureInputRef.current?.click();
      return;
    }
    setCameraOpen(true);
  };

  const captureFrame = async () => {
    const video = videoRef.current;
    if (!video) return;
    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setError('The camera could not be used in this browser.');
      return;
    }
    ctx.drawImage(video, 0, 0, width, height);
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((result) => resolve(result), 'image/jpeg', 0.9);
    });
    stopCamera();
    if (!blob) {
      setError('The photo could not be captured.');
      return;
    }
    await handleSave(blob);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      label="Daily Polaroid"
      className="max-w-md px-6 pb-6 pt-7 sm:px-8"
    >
      <h2 className="font-serif text-[32px] leading-none text-[var(--text)]">Daily Polaroid</h2>
      <p className="mt-2 font-serif text-[15px] italic text-[var(--muted)]">
        {hasPhoto ? 'One photo a day — replace it, or let it stay.' : 'One photo. Every day.'}
      </p>

      {previewUrl && !cameraOpen ? (
        <div className="mt-5 overflow-hidden rounded-lg border border-[var(--border)] bg-black/30">
          <img
            src={previewUrl}
            alt="Today's photo"
            className="aspect-[4/3] w-full object-cover"
          />
        </div>
      ) : null}

      {cameraOpen ? (
        <div className="mt-5">
          <video
            ref={videoRef}
            className="aspect-[4/3] w-full rounded-lg bg-black object-cover"
            playsInline
            muted
          />
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              className="btn-gold flex-1"
              onClick={() => void captureFrame()}
              disabled={busy}
            >
              Capture
            </button>
            <button type="button" className="btn-ghost" onClick={stopCamera} disabled={busy}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-5 grid gap-2.5">
          <button
            type="button"
            className="btn-ghost justify-start"
            onClick={() => fileInputRef.current?.click()}
            disabled={busy}
          >
            <UploadIcon className="h-4 w-4" />
            Upload a photo
          </button>
          {cameraSupported ? (
            <button
              type="button"
              className="btn-ghost justify-start"
              onClick={startCamera}
              disabled={busy}
            >
              <CameraIcon className="h-4 w-4" />
              Take a photo
            </button>
          ) : null}
          {hasPhoto ? (
            <button
              type="button"
              className="btn-ghost justify-start text-[var(--danger)]"
              onClick={() => void handleRemove()}
              disabled={busy}
            >
              <TrashIcon className="h-4 w-4" />
              Remove photo
            </button>
          ) : null}
        </div>
      )}

      {busy ? <p className="mt-3 text-sm text-[var(--muted)]">Preparing your photo…</p> : null}
      {error ? (
        <p role="alert" className="mt-3 text-sm text-[var(--danger)]">
          {error}
        </p>
      ) : null}

      <p className="mt-5 text-[11.5px] leading-relaxed text-[var(--muted)]">
        Resized to 1200px, converted to WebP and encrypted before it is stored on this device.
      </p>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => void handleFile(event)}
      />
      <input
        ref={captureInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(event) => void handleFile(event)}
      />
    </Modal>
  );
}
