import { NextRequest, NextResponse } from 'next/server';
import OpenAI, { toFile } from 'openai';
import {
  buildSystemPrompt,
  isStuckRequest,
  shouldIncrementHintLevel,
} from '@/lib/build-system-prompt';
import { synthesizeAlmaSpeech } from '@/lib/elevenlabs';
import { parseAlmaReply, type AlmaReplyJson } from '@/lib/parse-alma-reply';
import {
  getOpenAIErrorMessage,
  mimeToUploadFilename,
  resolveAudioMime,
} from '@/lib/audio-upload';
import { getActiveHintCount, getStage, isValidStageId, type StageId } from '@/lib/stages';

interface HistoryMessage {
  role: 'user' | 'assistant';
  content: string;
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
  const audioMimeRaw = formData.get('audioMime') as string | null;
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

    if (audioBlob.byteLength < 1000) {
      return NextResponse.json(
        { error: 'Lydfilen er for kort – hold optage-knappen længere nede' },
        { status: 400 },
      );
    }

    const normalizedMime = resolveAudioMime(audioMimeRaw || audioEntry.type, audioEntry.name);
    const filename =
      audioEntry.name && audioEntry.name.includes('.')
        ? audioEntry.name
        : mimeToUploadFilename(normalizedMime);

    const audioFile = await toFile(Buffer.from(audioBlob), filename, {
      type: normalizedMime,
    });

    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: process.env.OPENAI_TRANSCRIPTION_MODEL || 'whisper-1',
      language: 'da',
    });

    transcript = transcription.text.trim();
  } catch (err) {
    console.error('[alma/talk] Transcription error:', err);
    const detail = getOpenAIErrorMessage(err);
    return NextResponse.json(
      {
        error:
          process.env.NODE_ENV === 'development'
            ? `Transskription fejlede: ${detail}`
            : 'Fejl ved transskription af lyd – prøv igen eller brug Chrome',
      },
      { status: 500 },
    );
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

  let almaReply: AlmaReplyJson;
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
  const nextHintLevel = shouldIncrementHintLevel(stuck, hintLevel, getActiveHintCount(stage))
    ? hintLevel + 1
    : hintLevel;

  let audioBase64: string;
  let mimeType = 'audio/mpeg';
  try {
    const tts = await synthesizeAlmaSpeech(almaReply.speechText);
    audioBase64 = tts.audioBase64;
    mimeType = tts.mimeType;
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
