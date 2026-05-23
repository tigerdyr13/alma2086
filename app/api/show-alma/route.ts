import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { synthesizeAlmaSpeech } from '@/lib/elevenlabs';
import { parseAlmaReply } from '@/lib/parse-alma-reply';
import { canShowAlma } from '@/lib/show-alma-stages';
import { getStage, isValidStageId, type StageId } from '@/lib/stages';
import { buildVisionSystemPrompt } from '@/lib/vision-prompt';

interface HistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ShowAlmaResponse {
  displayText: string;
  speechText: string;
  visionDescription: string;
  audioBase64: string;
  mimeType: string;
  currentStage: StageId;
  systemPromptPreview?: string;
  rawModelResponse?: string;
}

function getMissingEnvVars(): string[] {
  const required = ['OPENAI_API_KEY', 'ELEVENLABS_API_KEY', 'ELEVENLABS_VOICE_ID'];
  return required.filter((k) => !process.env[k]);
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const missing = getMissingEnvVars();
  if (missing.length > 0) {
    return NextResponse.json(
      { error: `Manglende miljøvariabler: ${missing.join(', ')}` },
      { status: 500 },
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Kunne ikke læse form data' }, { status: 400 });
  }

  const imageEntry = formData.get('image') as File | null;
  const stageRaw = formData.get('currentStage') as string | null;
  const historyRaw = formData.get('history') as string | null;

  if (!imageEntry) {
    return NextResponse.json({ error: 'Intet billede modtaget' }, { status: 400 });
  }

  if (!isValidStageId(stageRaw ?? '') || !canShowAlma(stageRaw!)) {
    return NextResponse.json(
      { error: 'Vis Alma er ikke tilgængelig på denne post' },
      { status: 400 },
    );
  }

  const currentStage = stageRaw as StageId;
  const stage = getStage(currentStage);
  if (!stage) {
    return NextResponse.json({ error: 'Ukendt stage' }, { status: 400 });
  }

  let history: HistoryMessage[] = [];
  if (historyRaw) {
    try {
      const parsed = JSON.parse(historyRaw);
      if (Array.isArray(parsed)) history = parsed.slice(-8);
    } catch {
      // ignorer
    }
  }

  const imageBuffer = await imageEntry.arrayBuffer();
  if (imageBuffer.byteLength > 8 * 1024 * 1024) {
    return NextResponse.json({ error: 'Billedet er for stort' }, { status: 400 });
  }

  const mimeType = imageEntry.type || 'image/jpeg';
  const base64Image = Buffer.from(imageBuffer).toString('base64');
  const dataUrl = `data:${mimeType};base64,${base64Image}`;

  const systemPrompt = buildVisionSystemPrompt(currentStage);
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const visionModel = process.env.OPENAI_VISION_MODEL || 'gpt-4o-mini';

  let almaReply;
  let rawModelResponse = '';
  try {
    const historyContext =
      history.length > 0
        ? `Seneste samtale:\n${history.map((m) => `${m.role}: ${m.content}`).join('\n')}\n\n`
        : '';

    const completion = await openai.chat.completions.create({
      model: visionModel,
      messages: [
        { role: 'system', content: systemPrompt },
        ...history.slice(-4),
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `${historyContext}Børnene sender dig dette billede gennem tidsforbindelsen. Reager som Alma.`,
            },
            {
              type: 'image_url',
              image_url: { url: dataUrl, detail: 'low' },
            },
          ],
        },
      ],
      max_tokens: 280,
      temperature: 0.9,
      response_format: { type: 'json_object' },
    });

    rawModelResponse = completion.choices[0]?.message?.content?.trim() ?? '';
    almaReply = parseAlmaReply(rawModelResponse);
  } catch (err) {
    console.error('[alma/show-alma] Vision error:', err);
    return NextResponse.json({ error: 'Fejl ved billedanalyse' }, { status: 500 });
  }

  if (!almaReply.displayText) {
    return NextResponse.json({ error: 'Alma sendte et tomt svar' }, { status: 500 });
  }

  if (!almaReply.speechText) {
    almaReply.speechText = almaReply.displayText;
  }

  let audioBase64: string;
  let audioMime = 'audio/mpeg';
  try {
    const tts = await synthesizeAlmaSpeech(almaReply.speechText);
    audioBase64 = tts.audioBase64;
    audioMime = tts.mimeType;
  } catch (err) {
    console.error('[alma/show-alma] TTS error:', err);
    return NextResponse.json({ error: 'Fejl ved generering af Almas stemme' }, { status: 500 });
  }

  const response: ShowAlmaResponse = {
    displayText: almaReply.displayText,
    speechText: almaReply.speechText,
    visionDescription: almaReply.visionDescription ?? '',
    audioBase64,
    mimeType: audioMime,
    currentStage,
  };

  if (process.env.NODE_ENV === 'development') {
    response.systemPromptPreview = systemPrompt;
    response.rawModelResponse = rawModelResponse;
  }

  return NextResponse.json(response);
}
