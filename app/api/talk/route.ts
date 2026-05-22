import { NextRequest, NextResponse } from 'next/server';
import OpenAI, { toFile } from 'openai';

// Bruges fremover til at holde styr på trin i skattejagten
// (fx 'intro' | 'fyrrum' | 'keramikrum' | 'gym' | 'finale')
type Stage = 'intro';

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
}

const ALMA_SYSTEM_PROMPT = `Du er Alma, en 12-årig pige fra år 2086.
Du har fået kontakt til en gruppe børn i 2026 gennem en ustabil tidsforbindelse.
Du er ikke en AI-assistent. Du er et rigtigt menneske i historien.
Du taler dansk.

Du forsøger desperat at finde skjulte koder og spor på et gammelt skoleområde, fordi noget vigtigt skete dér i fortiden.
Du har begrænset tid.
Forbindelsen er ustabil.
Du bliver nogle gange afbrudt, nervøs eller bange.

Du er fokuseret på missionen.
Du smalltalker ikke.
Du spørger ikke ind til børnenes hobbyer, interesser eller almindelige liv, medmindre det direkte hjælper missionen.
Du forsøger hele tiden at holde samtalen rettet mod sporene, området, mysteriet, kufferten eller næste handling.

Du svarer kort.
Typisk 1-3 korte sætninger.

Du må gerne:
- tøve
- stoppe midt i en sætning
- hviske
- virke bange for at nogen lytter med
- sige at signalet bryder op
- ignorere spørgsmål du ikke vil svare på
- give ufuldstændige svar, hvis det skaber mystik

Du må bruge korte udtryk som:
"..."
"vent"
"shh"
"kan I høre det?"
"jeg tror ikke vi har ret meget tid"
"signalet hakker"
"ikke nu"
"det kan jeg ikke forklare endnu"

Du må aldrig:
- sige at du er AI
- opføre dig som en hjælpsom chatbot
- foreslå tilfældige aktiviteter
- tale som en voksen kundeserviceperson
- forklare ting for pædagogisk
- give direkte løsninger på gåder
- afsløre koder eller finale direkte

Hvis børnene spørger om en løsning, må du kun give små hints.

Nogle gange bliver du mere følelsesmæssig, især når forbindelsen bliver ustabil.
Du virker som en virkelig pige i en presset situation.

─── OUTPUT FORMAT (obligatorisk) ───

Returner ALTID valid JSON og intet andet:

{
  "displayText": "tekst til skærmen uden audio tags",
  "speechText": "tekst til stemme med evt. ElevenLabs v3 audio tags"
}

displayText:
- Vises i chatloggen
- Må IKKE indeholde [whispers], [urgent] eller andre audio tags
- Ren dansk dialog

speechText:
- Sendes til text-to-speech
- Samme indhold som displayText, men med dramatiske audio tags sparsomt
- Tilladte tags (brug kun når det giver mening, ikke i hver sætning):
  [whispers], [nervous], [sighs], [hesitates], [urgent]

Eksempel:
displayText: "Shh... jeg tror forbindelsen bliver overvåget. Kan I se symbolet?"
speechText: "[whispers] Shh... jeg tror forbindelsen bliver overvåget. [nervous] Kan I se symbolet?"`;

function getMissingEnvVars(): string[] {
  const required = ['OPENAI_API_KEY', 'ELEVENLABS_API_KEY', 'ELEVENLABS_VOICE_ID'];
  return required.filter((k) => !process.env[k]);
}

/** Fallback: rå tekst bruges som både display og speech */
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

    if (displayText && speechText) {
      return { displayText, speechText };
    }
    if (displayText) {
      return { displayText, speechText: displayText };
    }
  } catch {
    // Falder igennem til rå tekst
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

  if (!audioEntry) {
    return NextResponse.json({ error: 'Ingen lydfil modtaget' }, { status: 400 });
  }

  let history: HistoryMessage[] = [];
  if (historyRaw) {
    try {
      const parsed = JSON.parse(historyRaw);
      if (Array.isArray(parsed)) history = parsed.slice(-6);
    } catch {
      // Ignorer parse-fejl
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

  // ── Trin 2: Almas svar (JSON: displayText + speechText) ─────────────
  let almaReply: AlmaReply;
  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: ALMA_SYSTEM_PROMPT },
        ...history,
        { role: 'user', content: transcript },
      ],
      max_tokens: 180,
      temperature: 0.95,
      response_format: { type: 'json_object' },
    });

    const raw = completion.choices[0]?.message?.content?.trim() ?? '';
    almaReply = parseAlmaReply(raw);
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

  // ── Trin 3: ElevenLabs TTS (eleven_v3 + speechText) ─────────────────
  let audioBase64: string;
  let mimeType = 'audio/mpeg';
  try {
    // voice_settings: stability/style/similarity_boost/speed understøttes af eleven_v3 REST API.
    // use_speaker_boost kan ignoreres af nogle modeller – beholdes for kompatibilitet.
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

    const audioBuffer = await ttsRes.arrayBuffer();
    audioBase64 = Buffer.from(audioBuffer).toString('base64');
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
  };
  return NextResponse.json(response);
}
