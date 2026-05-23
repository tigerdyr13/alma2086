'use client';

import { useEffect, useId, useRef, useState } from 'react';
import type { Html5Qrcode } from 'html5-qrcode';
import { playSignalAcquiredSound, resolveQrToStagePath, vibrateOnScan } from '@/lib/qr-utils';

interface QrScannerProps {
  onClose: () => void;
}

async function stopScanner(scanner: Html5Qrcode | null) {
  if (!scanner) return;
  try {
    await scanner.stop();
  } catch {
    // allerede stoppet
  }
  try {
    scanner.clear();
  } catch {
    // ignore
  }
}

export default function QrScanner({ onClose }: QrScannerProps) {
  const elementId = useId().replace(/:/g, '');
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const handledRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    handledRef.current = false;
    let cancelled = false;

    async function start() {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      if (cancelled || !document.getElementById(elementId)) return;

      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        if (cancelled) return;

        await stopScanner(scannerRef.current);
        scannerRef.current = null;

        const scanner = new Html5Qrcode(elementId);
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 8,
            qrbox: { width: 240, height: 240 },
          },
          (decoded) => {
            try {
              if (handledRef.current) return;
              const path = resolveQrToStagePath(decoded);
              if (!path) return;

              handledRef.current = true;
              vibrateOnScan();
              playSignalAcquiredSound();

              void stopScanner(scanner).finally(() => {
                window.location.assign(path);
              });
            } catch (err) {
              console.error('[QrScanner] scan handler:', err);
            }
          },
          () => {
            // scan forsøg – ignorer
          },
        );

        if (!cancelled && mountedRef.current) setScanning(true);
      } catch (err) {
        console.error('[QrScanner]', err);
        if (cancelled || !mountedRef.current) return;

        const msg = err instanceof Error ? err.message : String(err);
        if (err instanceof DOMException && err.name === 'NotAllowedError') {
          setError('Kamera-adgang nægtet. Giv tilladelse og prøv igen.');
        } else if (msg.includes('NotSupportedError') || msg.includes('not supported')) {
          setError('QR-scan understøttes ikke i denne browser. Prøv Safari eller Chrome.');
        } else {
          setError('Kunne ikke starte scanner. Prøv igen eller scan med kamera-appen.');
        }
      }
    }

    void start();

    return () => {
      cancelled = true;
      mountedRef.current = false;
      void stopScanner(scannerRef.current);
      scannerRef.current = null;
    };
  }, [elementId]);

  return (
    <div className="scanner-overlay" role="dialog" aria-modal="true" aria-label="QR scanner">
      <div className="scanner-panel">
        <div className="scanner-header">
          <span className="scanner-title">SCANNING FOR SIGNAL…</span>
          <button type="button" className="scanner-close" onClick={onClose} aria-label="Luk scanner">
            ✕
          </button>
        </div>

        <div id={elementId} className="scanner-viewport" />

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
