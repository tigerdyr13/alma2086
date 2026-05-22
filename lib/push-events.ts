/**
 * Foundation for fremtidige push/interruption events.
 * Ingen runtime-logik endnu – kun struktur og placeholders.
 */

import type { StageId } from './stages';

export type PushEventTrigger = 'time' | 'manual' | 'stage_enter' | 'hint_exhausted';

export interface PushEvent {
  id: string;
  /** undefined = alle stages, ellers specifik stage */
  stage?: StageId;
  trigger: PushEventTrigger;
  /** Sekunder efter stage enter – kun for trigger: "time" */
  delaySeconds?: number;
  displayText: string;
  speechText: string;
  /** Kun én gang per session */
  once?: boolean;
}

/** Placeholder events – aktiveres senere */
export const pushEvents: PushEvent[] = [
  {
    id: 'intro-signal-flutter',
    stage: 'intro',
    trigger: 'time',
    delaySeconds: 45,
    displayText: 'Vent… signalet… hørte I det?',
    speechText: '[hesitates] Vent… [nervous] signalet… hørte I det?',
    once: true,
  },
  {
    id: 'fyrrum-urgent',
    stage: 'fyrrum',
    trigger: 'manual',
    displayText: 'I må skynde jer. Jeg tror nogen har opdaget forbindelsen.',
    speechText: '[urgent] I må skynde jer. [whispers] Jeg tror nogen har opdaget forbindelsen.',
    once: true,
  },
  {
    id: 'finale-connection-dying',
    stage: 'finale',
    trigger: 'time',
    delaySeconds: 120,
    displayText: 'Forbindelsen dør… jeg kan ikke blive meget længere…',
    speechText: '[sighs] Forbindelsen dør… [urgent] jeg kan ikke blive meget længere…',
    once: true,
  },
];

export function getPushEventsForStage(stageId: StageId): PushEvent[] {
  return pushEvents.filter((e) => !e.stage || e.stage === stageId);
}
