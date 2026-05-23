import { danishSpeechText } from './da-speech';

export interface AlmaReplyJson {
  displayText: string;
  speechText: string;
  visionDescription?: string;
}

export function parseAlmaReply(raw: string): AlmaReplyJson {
  const trimmed = raw.trim();
  if (!trimmed) return { displayText: '', speechText: '' };

  try {
    const cleaned = trimmed
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
    const parsed = JSON.parse(cleaned) as Record<string, unknown>;
    const displayText =
      typeof parsed.displayText === 'string' ? parsed.displayText.trim() : '';
    const speechText =
      typeof parsed.speechText === 'string' ? parsed.speechText.trim() : '';
    const visionDescription =
      typeof parsed.visionDescription === 'string'
        ? parsed.visionDescription.trim()
        : undefined;

    if (displayText && speechText) {
      return {
        displayText,
        speechText: danishSpeechText(displayText, speechText),
        visionDescription,
      };
    }
    if (displayText) {
      return { displayText, speechText: danishSpeechText(displayText), visionDescription };
    }
  } catch {
    // fallback
  }

  return { displayText: trimmed, speechText: danishSpeechText(trimmed) };
}
