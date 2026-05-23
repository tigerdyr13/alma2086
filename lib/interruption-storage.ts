import { STAGE_IDS, type StageId } from './stages';

const PREFIX = 'alma2086:interruption:';

function key(stageId: StageId, interruptionId: string): string {
  return `${PREFIX}${stageId}:${interruptionId}`;
}

export function hasInterruptionFired(stageId: StageId, interruptionId: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(key(stageId, interruptionId)) === '1';
  } catch {
    return false;
  }
}

export function markInterruptionFired(stageId: StageId, interruptionId: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key(stageId, interruptionId), '1');
  } catch {
    // ignore
  }
}

export function clearInterruptionFlag(stageId: StageId, interruptionId: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(key(stageId, interruptionId));
  } catch {
    // ignore
  }
}

export function clearInterruptionFlagsForStage(stageId: StageId): void {
  if (typeof window === 'undefined') return;
  try {
    const suffix = `${stageId}:`;
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(PREFIX) && k.includes(suffix)) toRemove.push(k);
    }
    toRemove.forEach((k) => localStorage.removeItem(k));
  } catch {
    // ignore
  }
}

export function clearAllInterruptionFlags(): void {
  STAGE_IDS.forEach((id) => clearInterruptionFlagsForStage(id));
}

export function getFiredInterruptionIds(stageId: StageId): string[] {
  if (typeof window === 'undefined') return [];
  const fired: string[] = [];
  const prefix = key(stageId, '');
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(prefix) && localStorage.getItem(k) === '1') {
        fired.push(k.slice(prefix.length));
      }
    }
  } catch {
    // ignore
  }
  return fired;
}
