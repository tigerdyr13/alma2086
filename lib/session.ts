import type { StageId } from './stages';

export interface ChatMessage {
  role: 'user' | 'alma';
  text: string;
}

export interface StageSession {
  messages: ChatMessage[];
  /** Antal hints givet på denne post (0–3) */
  hintLevel: number;
  visitedAt: string;
  updatedAt: string;
}

const STORAGE_PREFIX = 'alma2086:stage:';

function storageKey(stageId: StageId): string {
  return `${STORAGE_PREFIX}${stageId}`;
}

export function loadStageSession(stageId: StageId): StageSession {
  if (typeof window === 'undefined') {
    return emptySession();
  }

  try {
    const raw = localStorage.getItem(storageKey(stageId));
    if (!raw) return emptySession();
    const parsed = JSON.parse(raw) as StageSession;
    if (!Array.isArray(parsed.messages)) return emptySession();
    return {
      messages: parsed.messages,
      hintLevel: typeof parsed.hintLevel === 'number' ? parsed.hintLevel : 0,
      visitedAt: parsed.visitedAt ?? new Date().toISOString(),
      updatedAt: parsed.updatedAt ?? new Date().toISOString(),
    };
  } catch {
    return emptySession();
  }
}

export function saveStageSession(stageId: StageId, session: StageSession): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(
      storageKey(stageId),
      JSON.stringify({ ...session, updatedAt: new Date().toISOString() }),
    );
  } catch {
    // Storage fuld eller privat browsing – ignorer
  }
}

export function clearStageSession(stageId: StageId): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(storageKey(stageId));
}

function emptySession(): StageSession {
  const now = new Date().toISOString();
  return { messages: [], hintLevel: 0, visitedAt: now, updatedAt: now };
}
