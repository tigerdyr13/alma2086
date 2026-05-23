import { NextRequest, NextResponse } from 'next/server';
import { danishSpeechText } from '@/lib/da-speech';
import { synthesizeAlmaSpeech } from '@/lib/elevenlabs';

interface LineInput {
  displayText: string;
  speechText: string;
}

interface SegmentOutput {
  displayText: string;
  audioBase64: string;
  mimeType: string;
}

function getMissingEnvVars(): string[] {
  const required = ['ELEVENLABS_API_KEY', 'ELEVENLABS_VOICE_ID'];
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

  let body: { lines?: LineInput[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Ugyldig JSON' }, { status: 400 });
  }

  const lines = body.lines;
  if (!Array.isArray(lines) || lines.length === 0) {
    return NextResponse.json({ error: 'Ingen linjer angivet' }, { status: 400 });
  }

  try {
    const segments: SegmentOutput[] = [];
    for (const line of lines) {
      const speech = danishSpeechText(line.displayText, line.speechText);
      const { audioBase64, mimeType } = await synthesizeAlmaSpeech(speech);
      segments.push({
        displayText: line.displayText,
        audioBase64,
        mimeType,
      });
    }
    return NextResponse.json({ segments });
  } catch (err) {
    console.error('[interruption]', err);
    const msg = err instanceof Error ? err.message : 'TTS fejl';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
