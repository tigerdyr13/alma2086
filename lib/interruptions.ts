import type { StageId } from './stages';

export type InterruptionTrigger =
  | 'stage_enter'
  | 'timer'
  | 'inactivity'
  | 'after_image'
  | 'stuck';

export type InterruptionIntensity = 'normal' | 'strong';

export interface InterruptionLine {
  displayText: string;
  speechText: string;
  /** Pause efter denne linje er afspillet (ms) */
  pauseAfterMs?: number;
}

export interface InterruptionDef {
  id: string;
  trigger: InterruptionTrigger;
  /** Forsinkelse efter stage_enter / timer / after_image */
  delayMs?: number;
  /** For inactivity: ms uden brugeraktivitet */
  inactivityMs?: number;
  /** For stuck: minimum beskeder + ingen hint-progress */
  minMessages?: number;
  intensity?: InterruptionIntensity;
  lines: InterruptionLine[];
}

export type InterruptionsByStage = Partial<Record<StageId, InterruptionDef[]>>;

export const interruptions: InterruptionsByStage = {
  intro: [
    {
      id: 'intro_still_there',
      trigger: 'inactivity',
      inactivityMs: 80000,
      lines: [
        {
          displayText: '…are you still there?',
          speechText: '[whispers] ...are you still there?',
        },
      ],
    },
    {
      id: 'intro_remembered',
      trigger: 'timer',
      delayMs: 55000,
      lines: [
        {
          displayText: '…wait.',
          speechText: '[whispers] ...wait.',
          pauseAfterMs: 900,
        },
        {
          displayText: '…I think I remembered something.',
          speechText: '[whispers] ...I think I remembered something.',
        },
      ],
    },
  ],

  fyrrum: [
    {
      id: 'fyrrum_scans',
      trigger: 'timer',
      delayMs: 50000,
      lines: [
        {
          displayText: '…the room looks different than the scans.',
          speechText: '[whispers] ...the room looks different than the scans.',
        },
      ],
    },
    {
      id: 'fyrrum_inactive',
      trigger: 'inactivity',
      inactivityMs: 85000,
      lines: [
        {
          displayText: '…Esther?',
          speechText: '[whispers] ...Esther?',
        },
      ],
    },
    {
      id: 'fyrrum_after_image',
      trigger: 'after_image',
      delayMs: 10000,
      lines: [
        {
          displayText: '…yes. I can almost see it now.',
          speechText: '[whispers] ...yes. I can almost see it now.',
        },
      ],
    },
  ],

  keramik: [
    {
      id: 'keramik_missed',
      trigger: 'timer',
      delayMs: 48000,
      lines: [
        {
          displayText: '…I think you missed something.',
          speechText: '[whispers] ...I think you missed something.',
        },
      ],
    },
    {
      id: 'keramik_inactive',
      trigger: 'inactivity',
      inactivityMs: 75000,
      lines: [
        {
          displayText: '…are you still there?',
          speechText: '[whispers] ...are you still there?',
        },
      ],
    },
    {
      id: 'keramik_after_image',
      trigger: 'after_image',
      delayMs: 8000,
      lines: [
        {
          displayText: '…wait.',
          speechText: '[whispers] ...wait.',
          pauseAfterMs: 800,
        },
        {
          displayText: '…that matches the archive.',
          speechText: '[whispers] ...that matches the archive.',
        },
      ],
    },
  ],

  ude: [
    {
      id: 'hesteren_esther',
      trigger: 'stage_enter',
      delayMs: 14000,
      lines: [
        {
          displayText: '…Esther?',
          speechText: '[whispers] ...Esther?',
        },
      ],
    },
    {
      id: 'hesteren_not_alone',
      trigger: 'timer',
      delayMs: 28000,
      lines: [
        {
          displayText: "…I don't think you're alone there.",
          speechText: "[whispers] ...I don't think you're alone there.",
        },
      ],
    },
    {
      id: 'hesteren_warning',
      trigger: 'timer',
      delayMs: 45000,
      intensity: 'strong',
      lines: [
        {
          displayText: '…I think someone hid this place on purpose.',
          speechText: '[whispers] ...I think someone hid this place on purpose.',
          pauseAfterMs: 1600,
        },
        {
          displayText: '…hurry.',
          speechText: '[whispers] ...hurry.',
        },
      ],
    },
    {
      id: 'hesteren_collapse',
      trigger: 'inactivity',
      inactivityMs: 70000,
      lines: [
        {
          displayText: '…hurry.',
          speechText: '[whispers] ...hurry.',
          pauseAfterMs: 700,
        },
        {
          displayText: '…before the signal collapses again.',
          speechText: '[whispers] ...before the signal collapses again.',
        },
      ],
    },
    {
      id: 'hesteren_stuck',
      trigger: 'stuck',
      inactivityMs: 90000,
      minMessages: 2,
      lines: [
        {
          displayText: '…I think you missed something.',
          speechText: '[whispers] ...I think you missed something.',
        },
      ],
    },
    {
      id: 'hesteren_after_image',
      trigger: 'after_image',
      delayMs: 9000,
      lines: [
        {
          displayText: "…I don't think you're alone there.",
          speechText: "[whispers] ...I don't think you're alone there.",
        },
      ],
    },
  ],

  loft: [
    {
      id: 'loft_hurry',
      trigger: 'stage_enter',
      delayMs: 18000,
      lines: [
        {
          displayText: '…hurry.',
          speechText: '[whispers] ...hurry.',
        },
      ],
    },
    {
      id: 'loft_critical',
      trigger: 'timer',
      delayMs: 42000,
      intensity: 'strong',
      lines: [
        {
          displayText: '…the signal is breaking apart.',
          speechText: '[whispers] ...the signal is breaking apart.',
          pauseAfterMs: 1200,
        },
        {
          displayText: '…please hurry.',
          speechText: '[whispers] ...please hurry.',
        },
      ],
    },
    {
      id: 'loft_after_image',
      trigger: 'after_image',
      delayMs: 7000,
      intensity: 'strong',
      lines: [
        {
          displayText: '…I can feel it. the suitcase is close.',
          speechText: '[whispers] ...I can feel it. the suitcase is close.',
        },
      ],
    },
  ],

  finale: [
    {
      id: 'finale_thanks',
      trigger: 'stage_enter',
      delayMs: 12000,
      lines: [
        {
          displayText: '…thank you.',
          speechText: '[whispers] ...thank you.',
          pauseAfterMs: 1000,
        },
        {
          displayText: '…you found it.',
          speechText: '[whispers] ...you found it.',
        },
      ],
    },
  ],
};

export function getInterruptionsForStage(stageId: StageId): InterruptionDef[] {
  return interruptions[stageId] ?? [];
}
