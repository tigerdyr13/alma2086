import { NextRequest, NextResponse } from 'next/server';
import OpenAI, { toFile } from 'openai';
import {
  buildSystemPrompt,
  isStuckRequest,
  shouldIncrementHintLevel,
} from '@/lib/build-system-prompt';
import { getStage, isValidStageId, type StageId } from '@/lib/stages';

interface HistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AlmaReply {
  displayText: string;
  speechText: string;
}

interface TalkResponse {
  transcript: string;
  displayText: string;
  speechText: string;
  audioBase64: string;
  mimeType: string;
  currentStage: StageId;
  hintLevel: number;
  hintGiven: boolean;
  /** Kun inkluderet i development til debug panel */
  systemPromptPreview?: string;
}

function getMissingEnvVars(): string[] {
  const required = ['OPENAI_API_KEY', 'ELEVENLABS_API_KEY', 'ELEVENLABS_VOICE_ID'];
  return required.filter((k) => !process.env[k]);
}

function parseAlmaReply(raw: string): AlmaReply {
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

    if (displayText && speechText) return { displayText, speechText };
    if (displayText) return { displayText, speechText: displayText };
  } catch {
    // fallback
  }

  return { displayText: trimmed, speechText: trimmed };
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

  const audioEntry = formData.get('audio') as File | null;
  const historyRaw = formData.get('history') as string | null;
  const stageRaw = formData.get('currentStage') as string | null;
  const hintLevelRaw = formData.get('hintLevel') as string | null;

  if (!audioEntry) {
    return NextResponse.json({ error: 'Ingen lydfil modtaget' }, { status: 400 });
  }

  const currentStage: StageId = isValidStageId(stageRaw ?? '') ? (stageRaw as StageId) : 'intro';
  const stage = getStage(currentStage);
  if (!stage) {
    return NextResponse.json({ error: 'Ukendt stage' }, { status: 400 });
  }

  let hintLevel = 0;
  if (hintLevelRaw !== null) {
    const parsed = parseInt(hintLevelRaw, 10);
    if (!Number.isNaN(parsed) && parsed >= 0) hintLevel = parsed;
  }

  let history: HistoryMessage[] = [];
  if (historyRaw) {
    try {
      const parsed = JSON.parse(historyRaw);
      if (Array.isArray(parsed)) history = parsed.slice(-12);
    } catch {
      // ignorer
    }
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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

  const stuck = isStuckRequest(transcript);
  const systemPrompt = buildSystemPrompt({
    stageId: currentStage,
    hintLevel,
    isStuckRequest: stuck,
  });

  let almaReply: AlmaReply;
  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'user', content: transcript },
      ],
      max_tokens: 180,
      temperature: 0.95,
      response_format: { type: 'json_object' },
    });

    almaReply = parseAlmaReply(completion.choices[0]?.message?.content?.trim() ?? '');
  } catch (err) {
    console.error('[alma/talk] Chat completion error:', err);
    return NextResponse.json({ error: 'Fejl ved generering af Almas svar' }, { status: 500 });
  }

  if (!almaReply.displayText) {
    return NextResponse.json({ error: 'Alma sendte et tomt svar' }, { status: 500 });
  }

  if (!almaReply.speechText) {
    almaReply.speechText = almaReply.displayText;
  }

  const hintGiven = stuck;
  const nextHintLevel = shouldIncrementHintLevel(stuck, hintLevel, stage.hints.length)
    ? hintLevel + 1
    : hintLevel;

  let audioBase64: string;
  let mimeType = 'audio/mpeg';
  try {
    const ttsBody: Record<string, unknown> = {
      text: almaReply.speechText,
      model_id: 'eleven_v3',
      voice_settings: {
        stability: 0.35,
        similarity_boost: 0.8,
        style: 0.65,
        use_speaker_boost: true,
        speed: 0.95,
      },
    };

    const ttsRes = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${process.env.ELEVENLABS_VOICE_ID}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': process.env.ELEVENLABS_API_KEY!,
        },
        body: JSON.stringify(ttsBody),
      },
    );

    if (!ttsRes.ok) {
      const errBody = await ttsRes.text();
      console.error('[alma/talk] ElevenLabs error:', ttsRes.status, errBody);
      return NextResponse.json(
        { error: `ElevenLabs fejl (${ttsRes.status}) – tjek voice ID og eleven_v3-adgang` },
        { status: 500 },
      );
    }

    const contentType = ttsRes.headers.get('content-type');
    if (contentType) mimeType = contentType.split(';')[0].trim();

    audioBase64 = Buffer.from(await ttsRes.arrayBuffer()).toString('base64');
  } catch (err) {
    console.error('[alma/talk] TTS error:', err);
    return NextResponse.json({ error: 'Fejl ved ElevenLabs text-to-speech' }, { status: 500 });
  }

  const response: TalkResponse = {
    transcript,
    displayText: almaReply.displayText,
    speechText: almaReply.speechText,
    audioBase64,
    mimeType,
    currentStage,
    hintLevel: nextHintLevel,
    hintGiven,
  };

  if (process.env.NODE_ENV === 'development') {
    response.systemPromptPreview = systemPrompt;
  }

  return NextResponse.json(response);
}
