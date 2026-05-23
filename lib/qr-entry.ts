import { isValidStageId, type StageId } from './stages';

export type QrScanMode = 'ankomst' | 'fundet';

const QR_ENTRY_PREFIX = 'alma2086:qrEntry:';

function storageKey(stageId: StageId): string {
  return `${QR_ENTRY_PREFIX}${stageId}`;
}

export function markQrStageEntry(stageId: StageId, mode: QrScanMode): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(storageKey(stageId), mode);
  } catch {
    // ignore
  }
}

/** Læs og ryd ventende QR-scan for denne post */
export function consumeQrStageEntry(stageId: StageId): QrScanMode | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(storageKey(stageId));
    if (raw !== 'ankomst' && raw !== 'fundet') return null;
    sessionStorage.removeItem(storageKey(stageId));
    return raw;
  } catch {
    return null;
  }
}

export function peekQrStageEntry(stageId: StageId): QrScanMode | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(storageKey(stageId));
    if (raw === 'ankomst' || raw === 'fundet') return raw;
    return null;
  } catch {
    return null;
  }
}
