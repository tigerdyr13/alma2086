import type { StageId } from './stages';

const LAST_TRANSITION_KEY = 'alma2086:lastTransition';
const PENDING_AUDIO_KEY = 'alma2086:pendingTransitionAudio';

interface LastTransitionRecord {
  stageId: StageId;
  at: number;
}

/** Sæt flag før QR-navigation – brugerens gesture kan hjælpe med lyd */
export function markPendingTransitionAudio(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(PENDING_AUDIO_KEY, String(Date.now()));
  } catch {
    // ignore
  }
}

export function consumePendingTransitionAudio(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = sessionStorage.getItem(PENDING_AUDIO_KEY);
    if (!raw) return false;
    sessionStorage.removeItem(PENDING_AUDIO_KEY);
    const at = Number(raw);
    return Number.isFinite(at) && Date.now() - at < 8000;
  } catch {
    return false;
  }
}

/** Undgå dobbelt-afspilning ved React Strict Mode / hurtig re-mount */
export function shouldPlayStageTransition(stageId: StageId): boolean {
  if (typeof window === 'undefined') return true;

  try {
    const raw = sessionStorage.getItem(LAST_TRANSITION_KEY);
    const now = Date.now();

    if (raw) {
      const parsed = JSON.parse(raw) as LastTransitionRecord;
      if (parsed.stageId === stageId && now - parsed.at < 800) {
        return false;
      }
    }

    sessionStorage.setItem(
      LAST_TRANSITION_KEY,
      JSON.stringify({ stageId, at: now } satisfies LastTransitionRecord),
    );
    return true;
  } catch {
    return true;
  }
}

export function vibrateOnLinkEstablished(): void {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate([40, 60, 40]);
  }
}
