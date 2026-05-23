/** Løs QR-scan til intern stage-URL */
export function resolveQrToStagePath(decoded: string): string | null {
  const trimmed = decoded.trim();

  if (/^\/s\/[a-z]+$/.test(trimmed)) return trimmed;

  try {
    const base =
      typeof window !== 'undefined' ? window.location.origin : 'https://localhost';
    const url = new URL(trimmed, base);
    if (/^\/s\/[a-z]+$/.test(url.pathname)) return url.pathname;
  } catch {
    // ikke en URL
  }

  return null;
}

/** Kort bip ved successfuld QR-scan */
export function playSignalAcquiredSound(): void {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.25);
    setTimeout(() => void ctx.close(), 400);
  } catch {
    // ignorer
  }
}

export function vibrateOnScan(): void {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(80);
  }
}
