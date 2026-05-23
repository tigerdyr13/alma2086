'use client';

import { useEffect, useRef, useState } from 'react';
import { compressImageForUpload } from '@/lib/image-compress';

interface ShowAlmaCameraProps {
  onClose: () => void;
  onSend: (imageBlob: Blob) => void;
  disabled?: boolean;
}

export default function ShowAlmaCamera({ onClose, onSend, disabled }: ShowAlmaCameraProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const openedRef = useRef(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openCamera = () => {
    setError(null);
    inputRef.current?.click();
  };

  useEffect(() => {
    if (!openedRef.current) {
      openedRef.current = true;
      openCamera();
    }
  }, []);

  const handleFile = async (file: File | null) => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const compressed = await compressImageForUpload(file);
      if (preview) URL.revokeObjectURL(preview);
      setPreview(URL.createObjectURL(compressed));
      setBlob(compressed);
    } catch {
      setError('Kunne ikke behandle billedet. Prøv igen.');
    } finally {
      setBusy(false);
    }
  };

  const handleSend = () => {
    if (blob && !disabled) onSend(blob);
  };

  const handleRetake = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setBlob(null);
    openCamera();
  };

  return (
    <div className="show-alma-overlay" role="dialog" aria-modal="true" aria-label="Vis Alma">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="show-alma-input"
        onChange={(e) => void handleFile(e.target.files?.[0] ?? null)}
      />

      <div className="show-alma-panel">
        <div className="show-alma-header">
          <span className="show-alma-title">VIS ALMA STEDET</span>
          <button type="button" className="scanner-close" onClick={onClose} aria-label="Luk">
            ✕
          </button>
        </div>

        {!preview ? (
          <>
            <p className="show-alma-hint">Tag et billede af hvor I er. Alma ser det gennem signalet.</p>
            <button
              type="button"
              className="action-btn action-btn--show"
              onClick={openCamera}
              disabled={busy || disabled}
            >
              📷 ÅBN KAMERA
            </button>
          </>
        ) : (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Preview" className="show-alma-preview" />
            <div className="show-alma-actions">
              <button type="button" className="action-btn action-btn--secondary" onClick={handleRetake}>
                Tag igen
              </button>
              <button
                type="button"
                className="action-btn action-btn--primary"
                onClick={handleSend}
                disabled={disabled}
              >
                Send til 2086
              </button>
            </div>
          </>
        )}

        {error && <p className="scanner-error">{error}</p>}
      </div>
    </div>
  );
}
