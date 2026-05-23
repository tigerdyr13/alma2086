/** ElevenLabs-tags (engelske) – selve teksten skal altid være dansk */
const TAG_RE = /^\[([a-z_]+)\]\s*/i;

export type AlmaSpeechTag = 'whispers' | 'nervous' | 'sighs' | 'hesitates' | 'urgent';

export function extractSpeechTag(speechText?: string): AlmaSpeechTag {
  const match = speechText?.match(TAG_RE);
  const tag = match?.[1]?.toLowerCase();
  if (
    tag === 'nervous' ||
    tag === 'sighs' ||
    tag === 'hesitates' ||
    tag === 'urgent' ||
    tag === 'whispers'
  ) {
    return tag;
  }
  return 'whispers';
}

/** TTS skal altid bruge dansk displayText – undgår engelsk i stemmen */
export function danishSpeechText(displayText: string, speechText?: string): string {
  const tag = extractSpeechTag(speechText);
  return `[${tag}] ${displayText.trim()}`;
}

export function scriptLine(
  displayText: string,
  tag: AlmaSpeechTag = 'whispers',
  pauseAfterMs?: number,
) {
  return {
    displayText,
    speechText: danishSpeechText(displayText, `[${tag}]`),
    pauseAfterMs,
  };
}
