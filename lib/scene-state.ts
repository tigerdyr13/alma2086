export type SceneState =
  | 'arrival'
  | 'search'
  | 'reaction'
  | 'briefing'
  | 'transition'
  | 'completed';

export interface ScriptLine {
  displayText: string;
  speechText: string;
  pauseAfterMs?: number;
}

export interface StageSceneConfig {
  objective: string | null;
  /** false = intro: ingen spor-QR, afslut via briefing alene */
  requiresClueQr: boolean;
  minSearchExchanges: number;
  minBriefingExchanges: number;
  entranceArrivalDialogue: readonly ScriptLine[];
  clueFoundDialogue: readonly ScriptLine[];
  transitionDialogue: readonly ScriptLine[];
  nextStageHint: string;
  searchFocus: string;
  briefingFocus: string;
  transitionDelayMs?: number;
  betweenStagesGuidance: string;
  nextStageLabel: string | null;
}

export function isSceneInteractive(state: SceneState): boolean {
  return state === 'search' || state === 'briefing';
}

export function isSceneClosed(state: SceneState): boolean {
  return state === 'completed';
}
