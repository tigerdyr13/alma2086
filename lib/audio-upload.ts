/** Map browser MediaRecorder MIME til filnavn OpenAI Whisper accepterer */

const MIME_TO_EXT: Record<string, string> = {
  'audio/webm': 'webm',
  'audio/ogg': 'ogg',
  'audio/mpeg': 'mp3',
  'audio/mp3': 'mp3',
  'audio/mp4': 'm4a',
  'audio/x-m4a': 'm4a',
  'audio/wav': 'wav',
  'audio/wave': 'wav',
  'audio/x-wav': 'wav',
  'audio/flac': 'flac',
};

export function normalizeMimeType(mimeType: string): string {
  return mimeType.split(';')[0].trim().toLowerCase();
}

export function mimeToExtension(mimeType: string): string {
  const base = normalizeMimeType(mimeType);
  return MIME_TO_EXT[base] ?? 'webm';
}

export function mimeToUploadFilename(mimeType: string): string {
  return `recording.${mimeToExtension(mimeType)}`;
}

const EXT_TO_MIME: Record<string, string> = {
  webm: 'audio/webm',
  ogg: 'audio/ogg',
  m4a: 'audio/mp4',
  mp4: 'audio/mp4',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  flac: 'audio/flac',
};

export function resolveAudioMime(mimeType: string | null, filename: string | null): string {
  if (mimeType?.trim()) return normalizeMimeType(mimeType);
  if (filename?.includes('.')) {
    const ext = filename.split('.').pop()?.toLowerCase() ?? '';
    if (EXT_TO_MIME[ext]) return EXT_TO_MIME[ext];
  }
  return 'audio/webm';
}

export function getOpenAIErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err) {
    const msg = String((err as { message: unknown }).message);
    if (msg.includes('Invalid file format')) {
      return 'Lydformat ikke understøttet – prøv Chrome eller hold knappen længere nede';
    }
    if (msg.includes('401') || msg.toLowerCase().includes('incorrect api key')) {
      return 'Ugyldig OpenAI API-nøgle';
    }
    return msg.length > 120 ? `${msg.slice(0, 120)}…` : msg;
  }
  return 'Ukendt serverfejl';
}
