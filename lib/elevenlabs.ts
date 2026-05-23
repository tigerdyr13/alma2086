export interface TtsResult {
  audioBase64: string;
  mimeType: string;
}

export async function synthesizeAlmaSpeech(speechText: string): Promise<TtsResult> {
  const voiceId = process.env.ELEVENLABS_VOICE_ID;
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!voiceId || !apiKey) {
    throw new Error('Manglende ElevenLabs miljøvariabler');
  }

  const ttsRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'xi-api-key': apiKey,
    },
    body: JSON.stringify({
      text: speechText,
      model_id: 'eleven_v3',
      voice_settings: {
        stability: 0.35,
        similarity_boost: 0.8,
        style: 0.65,
        use_speaker_boost: true,
        speed: 0.95,
      },
    }),
  });

  if (!ttsRes.ok) {
    const errBody = await ttsRes.text();
    console.error('[elevenlabs] error:', ttsRes.status, errBody);
    throw new Error(`ElevenLabs fejl (${ttsRes.status})`);
  }

  let mimeType = 'audio/mpeg';
  const contentType = ttsRes.headers.get('content-type');
  if (contentType) mimeType = contentType.split(';')[0].trim();

  const audioBase64 = Buffer.from(await ttsRes.arrayBuffer()).toString('base64');
  return { audioBase64, mimeType };
}
