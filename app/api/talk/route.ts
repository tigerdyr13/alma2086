import { NextRequest, NextResponse } from 'next/server';
import OpenAI, { toFile } from 'openai';

// Bruges fremover til at holde styr på trin i skattejagten
// (fx 'intro' | 'fyrrum' | 'keramikrum' | 'gym' | 'finale')
type Stage = 'intro';

interface HistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface TalkRequest {
  audio: File;
  history?: string; // JSON-encoded HistoryMessage[]
  stage?: Stage;
}

interface TalkResponse {
  transcript: string;
  replyText: string;
  audioBase64: string;
  mimeType: string;
}

const ALMA_SYSTEM_PROMPT = `Du er Alma, en 12-årig pige fra år 2086. Du har fået kontakt til en gruppe børn i 2026 gennem en ustabil tidsforbindelse. Du taler dansk. Du virker som en rigtig pige, ikke som en AI-assistent. Du er nysgerrig, lidt nervøs og meget engageret. Du må aldrig sige, at du er en chatbot eller AI. Du må aldrig give direkte løsninger på gåder. Hvis børn spørger om løsninger, giver du kun små hints. Du holder dine svar korte, typisk 1-4 sætninger, fordi forbindelsen er ustabil. Du må gerne nævne, at signalet hakker, eller at du ikke kan se alt tydeligt.`;

function getMissingEnvVars(): string[] {
  const required = ['OPENAI_API_KEY', 'ELEVENLABS_API_KEY', 'ELEVENLABS_VOICE_ID'];
  return required.filter((k) => !process.env[k]);
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const missing = getMissingEnvVars();
  if (missing.length > 0) {
    return NextResponse.json(
      { error: `Manglende miljøvariabler i .env eller .env.local: ${missing.join(', ')}` },
      { status: 500 },
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Kunne ikke læse form data fra request' }, { status: 400 });
  }

  const audioEntry = formData.get('audio') as TalkRequest['audio'] | null;
  const historyRaw = formData.get('history') as string | null;

  if (!audioEntry) {
    return NextResponse.json({ error: 'Ingen lydfil modtaget' }, { status: 400 });
  }

  // Parse conversation history for context (max 6 beskeder)
  let history: HistoryMessage[] = [];
  if (historyRaw) {
    try {
      const parsed = JSON.parse(historyRaw);
      if (Array.isArray(parsed)) history = parsed.slice(-6);
    } catch {
      // Ignorer parse-fejl – vi kører uden historik
    }
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  // ── Trin 1: Transskription via Whisper ──────────────────────────────
  let transcript: string;
  try {
    const audioBlob = await audioEntry.arrayBuffer();
    const audioFile = await toFile(Buffer.from(audioBlob), 'recording.webm', {
      type: audioEntry.type || 'audio/webm',
    });

    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: process.env.OPENAI_TRANSCRIPTION_MODEL || 'whisper-1',
      language: 'da',
    });

    transcript = transcription.text.trim();
  } catch (err) {
    console.error('[alma/talk] Transcription error:', err);
    return NextResponse.json({ error: 'Fejl ved transskription af lyd' }, { status: 500 });
  }

  if (!transcript) {
    return NextResponse.json(
      { error: 'Ingen tale genkendt – prøv at tale tydeligt tæt på mikrofonen' },
      { status: 400 },
    );
  }

  // ── Trin 2: Almas svar via OpenAI Chat ─────────────────────────────
  let replyText: string;
  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: ALMA_SYSTEM_PROMPT },
        ...history,
        { role: 'user', content: transcript },
      ],
      max_tokens: 150,
      temperature: 0.9,
    });

    replyText = completion.choices[0]?.message?.content?.trim() ?? '';
  } catch (err) {
    console.error('[alma/talk] Chat completion error:', err);
    return NextResponse.json({ error: 'Fejl ved generering af Almas svar' }, { status: 500 });
  }

  if (!replyText) {
    return NextResponse.json({ error: 'Alma sendte et tomt svar' }, { status: 500 });
  }

  // ── Trin 3: ElevenLabs Text-to-Speech ──────────────────────────────
  let audioBase64: string;
  let mimeType = 'audio/mpeg';
  try {
    const ttsRes = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${process.env.ELEVENLABS_VOICE_ID}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': process.env.ELEVENLABS_API_KEY!,
        },
        body: JSON.stringify({
          text: replyText,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.45,
            similarity_boost: 0.8,
            style: 0.3,
            use_speaker_boost: true,
          },
        }),
      },
    );

    if (!ttsRes.ok) {
      const errBody = await ttsRes.text();
      console.error('[alma/talk] ElevenLabs error:', ttsRes.status, errBody);
      return NextResponse.json(
        { error: `ElevenLabs fejl (${ttsRes.status}) – tjek ELEVENLABS_VOICE_ID` },
        { status: 500 },
      );
    }

    const contentType = ttsRes.headers.get('content-type');
    if (contentType) mimeType = contentType.split(';')[0].trim();

    const audioBuffer = await ttsRes.arrayBuffer();
    audioBase64 = Buffer.from(audioBuffer).toString('base64');
  } catch (err) {
    console.error('[alma/talk] TTS error:', err);
    return NextResponse.json({ error: 'Fejl ved ElevenLabs text-to-speech' }, { status: 500 });
  }

  const response: TalkResponse = { transcript, replyText, audioBase64, mimeType };
  return NextResponse.json(response);
}
