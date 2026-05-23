import { STAGE_IDS, type StageId } from './stages';
import type { SceneState } from './scene-state';

export interface ChatMessage {
  role: 'user' | 'alma';
  text: string;
}

export interface StageSession {
  messages: ChatMessage[];
  hintLevel: number;
  visitedAt: string;
  updatedAt: string;
  sceneState: SceneState;
  hasArrived: boolean;
  clueFound: boolean;
  arrivalPlayed: boolean;
  searchUserMessages: number;
  briefingUserMessages: number;
  briefingConfirmed: boolean;
}

const STORAGE_PREFIX = 'alma2086:stage:';

function storageKey(stageId: StageId): string {
  return `${STORAGE_PREFIX}${stageId}`;
}

function migrateSceneState(raw: string | undefined): SceneState {
  if (raw === 'discovery') return 'search';
  if (
    raw === 'arrival' ||
    raw === 'search' ||
    raw === 'reaction' ||
    raw === 'briefing' ||
    raw === 'transition' ||
    raw === 'completed'
  ) {
    return raw;
  }
  return 'arrival';
}

export function loadStageSession(stageId: StageId): StageSession {
  if (typeof window === 'undefined') {
    return emptySession();
  }

  try {
    const raw = localStorage.getItem(storageKey(stageId));
    if (!raw) return emptySession();
    const parsed = JSON.parse(raw) as StageSession & {
      objectiveComplete?: boolean;
      discoveryUserMessages?: number;
    };
    if (!Array.isArray(parsed.messages)) return emptySession();

    const sceneState = migrateSceneState(parsed.sceneState);
    const clueFound = Boolean(parsed.clueFound ?? parsed.objectiveComplete);
    const hasArrived = Boolean(
      parsed.hasArrived ?? (parsed.arrivalPlayed && sceneState !== 'arrival'),
    );

    return {
      messages: parsed.messages,
      hintLevel: typeof parsed.hintLevel === 'number' ? parsed.hintLevel : 0,
      visitedAt: parsed.visitedAt ?? new Date().toISOString(),
      updatedAt: parsed.updatedAt ?? new Date().toISOString(),
      sceneState,
      hasArrived,
      clueFound,
      arrivalPlayed: Boolean(parsed.arrivalPlayed),
      searchUserMessages:
        typeof parsed.searchUserMessages === 'number'
          ? parsed.searchUserMessages
          : typeof parsed.discoveryUserMessages === 'number'
            ? parsed.discoveryUserMessages
            : 0,
      briefingUserMessages:
        typeof parsed.briefingUserMessages === 'number' ? parsed.briefingUserMessages : 0,
      briefingConfirmed: Boolean(parsed.briefingConfirmed),
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
    // ignore
  }
}

export function clearStageSession(stageId: StageId): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(storageKey(stageId));
}

export interface StageSessionSummary {
  stageId: StageId;
  messageCount: number;
  hintLevel: number;
  visitedAt: string | null;
  updatedAt: string | null;
  hasData: boolean;
}

export function getAllStageSessionSummaries(): StageSessionSummary[] {
  return STAGE_IDS.map((stageId) => {
    const session = loadStageSession(stageId);
    const hasData =
      session.messages.length > 0 ||
      session.hintLevel > 0 ||
      session.hasArrived ||
      session.clueFound ||
      session.arrivalPlayed;
    return {
      stageId,
      messageCount: session.messages.length,
      hintLevel: session.hintLevel,
      visitedAt: hasData ? session.visitedAt : null,
      updatedAt: hasData ? session.updatedAt : null,
      hasData,
    };
  });
}

export function clearAllStageSessions(): void {
  STAGE_IDS.forEach((stageId) => clearStageSession(stageId));
}

function emptySession(): StageSession {
  const now = new Date().toISOString();
  return {
    messages: [],
    hintLevel: 0,
    visitedAt: now,
    updatedAt: now,
    sceneState: 'arrival',
    hasArrived: false,
    clueFound: false,
    arrivalPlayed: false,
    searchUserMessages: 0,
    briefingUserMessages: 0,
    briefingConfirmed: false,
  };
}
