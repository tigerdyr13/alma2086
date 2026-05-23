'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { playSignalAcquiredSound, resolveQrToStagePath, vibrateOnScan } from '@/lib/qr-utils';

interface QrScannerProps {
  onClose: () => void;
}

export default function QrScanner({ onClose }: QrScannerProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef<{ stop: () => Promise<void> } | null>(null);
  const handledRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        if (cancelled) return;

        const scanner = new Html5Qrcode('qr-reader');
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          { fps: 8, qrbox: { width: 260, height: 260 }, aspectRatio: 1 },
          (decoded) => {
            if (handledRef.current) return;
            const path = resolveQrToStagePath(decoded);
            if (!path) return;

            handledRef.current = true;
            vibrateOnScan();
            playSignalAcquiredSound();

            void scanner.stop().finally(() => {
              router.push(path);
            });
          },
          () => {
            // scan attempt – ignorer
          },
        );

        if (!cancelled) setScanning(true);
      } catch (err) {
        console.error('[QrScanner]', err);
        if (cancelled) return;
        if (err instanceof DOMException && err.name === 'NotAllowedError') {
          setError('Kamera-adgang nægtet. Giv tilladelse og prøv igen.');
        } else {
          setError('Kunne ikke starte scanner. Prøv Chrome/Safari med HTTPS.');
        }
      }
    }

    void start();

    return () => {
      cancelled = true;
      const s = scannerRef.current;
      if (s) {
        void s.stop().catch(() => {});
      }
    };
  }, [router]);

  return (
    <div className="scanner-overlay" role="dialog" aria-modal="true" aria-label="QR scanner">
      <div className="scanner-panel">
        <div className="scanner-header">
          <span className="scanner-title">SCANNING FOR SIGNAL…</span>
          <button type="button" className="scanner-close" onClick={onClose} aria-label="Luk scanner">
            ✕
          </button>
        </div>

        <div id="qr-reader" className="scanner-viewport" />

        <div className="scanner-scanline" aria-hidden="true" />

        {error ? (
          <p className="scanner-error">{error}</p>
        ) : (
          <p className="scanner-hint">
            {scanning ? 'Ret kameraet mod QR-koden' : 'Starter kamera…'}
          </p>
        )}
      </div>
    </div>
  );
}
