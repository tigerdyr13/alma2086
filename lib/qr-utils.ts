import { isValidStageId, type StageId } from './stages';
import type { QrScanMode } from './qr-entry';

export interface QrDestination {
  stageId: StageId;
  mode: QrScanMode;
}

/** Udtræk stage-id fra intern stage-sti (kun ren post, uden /fundet) */
export function stageIdFromPath(path: string): string | null {
  const match = path.match(/^\/s\/([a-z]+)(?:\/fundet)?\/?$/);
  return match?.[1] ?? null;
}

/** Løs QR-scan til stage + mode (ankomst | fundet) */
export function resolveQrDestination(decoded: string): QrDestination | null {
  const trimmed = decoded.trim();

  const tryPath = (pathname: string): QrDestination | null => {
    const fundetMatch = pathname.match(/^\/s\/([a-z]+)\/fundet\/?$/);
    if (fundetMatch && isValidStageId(fundetMatch[1])) {
      return { stageId: fundetMatch[1], mode: 'fundet' };
    }
    const ankomstMatch = pathname.match(/^\/s\/([a-z]+)\/?$/);
    if (ankomstMatch && isValidStageId(ankomstMatch[1])) {
      return { stageId: ankomstMatch[1], mode: 'ankomst' };
    }
    return null;
  };

  const direct = tryPath(trimmed.startsWith('/') ? trimmed : `/${trimmed}`);
  if (direct) return direct;

  try {
    const base =
      typeof window !== 'undefined' ? window.location.origin : 'https://localhost';
    const url = new URL(trimmed, base);
    return tryPath(url.pathname);
  } catch {
    return null;
  }
}

/** @deprecated Brug resolveQrDestination */
export function resolveQrToStagePath(decoded: string): string | null {
  const dest = resolveQrDestination(decoded);
  if (!dest) return null;
  return dest.mode === 'fundet' ? `/s/${dest.stageId}/fundet` : `/s/${dest.stageId}`;
}

export function qrDestinationToPath(dest: QrDestination): string {
  return dest.mode === 'fundet' ? `/s/${dest.stageId}/fundet` : `/s/${dest.stageId}`;
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
