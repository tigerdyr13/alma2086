# Alma 2086

En Next.js-app til børne-skattejagt. Brugere kan tale med Alma, en 12-årig pige fra år 2086, via tale-til-tale-chat.

**Tech-stack:** Next.js 15 · React 19 · TypeScript · OpenAI Whisper + GPT · ElevenLabs TTS

---

## Forudsætninger

- Node.js 20+
- npm 10+
- OpenAI API-nøgle
- ElevenLabs API-nøgle + Voice ID

---

## Lokal udvikling

### 1. Klon og installer

```bash
cd /path/til/projektet
npm install
```

### 2. Opret `.env.local`

```bash
cp .env.example .env.local
```

Rediger `.env.local` og udfyld alle værdier:

```env
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
OPENAI_TRANSCRIPTION_MODEL=whisper-1

ELEVENLABS_API_KEY=...
ELEVENLABS_VOICE_ID=...
```

> **ElevenLabs Voice ID:** Gå til [elevenlabs.io/app](https://elevenlabs.io/app), vælg eller klon en stemme (til Alma anbefales en ung kvindelig stemme), og kopier voice ID fra URL'en eller stemme-indstillingerne.

### 3. Start udviklingsserver

```bash
npm run dev
```

Åbn [http://localhost:3005/s/intro](http://localhost:3005/s/intro) i browseren.

Test andre stages direkte via URL, fx `/s/fyrrum`, `/s/keramik`, `/s/loft`.

> **Vigtigt (HTTPS på mobil):** Mikrofon-adgang kræver HTTPS eller `localhost`. Til test fra telefon på lokalt netværk kan du bruge:
> ```bash
> npx local-ssl-proxy --source 3443 --target 3005 --cert localhost.pem --key localhost-key.pem
> ```
> Eller brug Ngrok: `ngrok http 3005`

---

## Deployment på Ubuntu Server 24.04 med PM2

### Forudsætninger på serveren

```bash
# Node.js 20 via nvm eller NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# PM2 globalt
sudo npm install -g pm2
```

### 1. Overfør filer til serveren

```bash
# Fra din lokale maskine (rsync anbefales):
rsync -avz --exclude='node_modules' --exclude='.next' --exclude='.env.local' \
  /sti/til/alma2086/ bruger@din-server:/DATA/Websites/alma2086/
```

### 2. Konfigurer miljøvariabler på serveren

```bash
ssh bruger@din-server
cd /DATA/Websites/alma2086
cp .env.example .env.local
nano .env.local   # Udfyld dine API-nøgler
```

### 3. Installer afhængigheder og byg

```bash
cd /DATA/Websites/alma2086
npm install
npm run build
```

### 4. Opret PM2 ecosystem-fil

```bash
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'alma2086',
      script: 'node_modules/.bin/next',
      args: 'start',
      cwd: '/DATA/Websites/alma2086',
      env: {
        NODE_ENV: 'production',
        PORT: '3005',
      },
    },
  ],
};
EOF
```

### 5. Start med PM2

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup   # Følg instruktionerne for at aktivere autostart ved reboot
```

### 6. Nyttige PM2-kommandoer

```bash
pm2 status              # Se alle apps
pm2 logs alma2086       # Se live-logs
pm2 restart alma2086    # Genstart
pm2 stop alma2086       # Stop
pm2 delete alma2086     # Fjern fra PM2
```

### 7. Nginx Proxy Manager (konfigureres separat)

Peg din proxy-host på `http://localhost:3005`. Appen kræver **ikke** SSL selv — det håndterer Nginx Proxy Manager.

---

## Opdatering af appen på serveren

```bash
cd /DATA/Websites/alma2086
# Træk nye filer (rsync eller git pull)
npm install
npm run build
pm2 restart alma2086
```

---

## Story engine & stages

Alma2086 er bygget som en **narrativ engine** — ikke bare en chat. Hvert fysisk stop på skattejagten har sit eget **stage** med egen kontekst, hints og begrænsninger.

### Routes

| URL | Stage |
|-----|-------|
| `/s/intro` | Første kontakt |
| `/s/fyrrum` | Fyrrummet |
| `/s/keramik` | Keramikrummet |
| `/s/ude` | Udearealet |
| `/s/loft` | Loftet |
| `/s/finale` | Afslutning |

Ukendt stage → dramatisk **SIGNAL LOST**-side.

`/` redirecter automatisk til `/s/intro`.

### Central config: `lib/stages.ts`

Al story-data samles her (klar til senere adminpanel):

```typescript
export const stages = {
  fyrrum: {
    title: 'Fyrrummet',
    signalLocation: 'FYRRUMMET',
    almaKnows: '...',
    hints: ['lille hint', 'medium hint', 'stærkt hint'],
    forbiddenTopics: ['loft', 'finale'],
    sceneMood: '...',
    narrative: '...',
    connectionStability: 62,
  },
  // ...
};
```

### Sådan opretter du et nyt stage

1. Tilføj stage-id til `STAGE_IDS` i `lib/stages.ts`
2. Tilføj et objekt i `stages` med title, hints, forbiddenTopics osv.
3. Opret QR-kode der peger på `https://alma2086.babehill.com/s/dit-stage-navn`
4. Test i dev med debug-panelet (kun `npm run dev`)

Ingen UI- eller API-ændringer nødvendige — prompts bygges automatisk.

### Systemprompt

`lib/build-system-prompt.ts` bygger prompten dynamisk ud fra:

- Base Alma-personlighed
- Aktuelt stage (hvor børnene er, hvad Alma ved)
- `forbiddenTopics` (hvad hun ikke må afsløre)
- Hint-niveau (0–3) når børn er stuck

Preview i development: `GET /api/debug/prompt?stage=fyrrum&hintLevel=1&stuck=1`

### Hint-system

Hver stage har 3 gradvise hints i `stages.ts`.

Når børn siger fx *"vi kan ikke finde det"*:
1. Backend detekterer stuck-request
2. Alma får hint niveau 0 → 1 → 2
3. `hintLevel` gemmes per stage i `localStorage`

### Session memory

Per stage i browseren (`localStorage`):

- Chatbeskeder
- Hint-niveau
- Besøgstidspunkt

Nøgle: `alma2086:stage:fyrrum` osv.

Ingen database — hver QR-URL er selvstændig.

### QR-koder (senere)

Hver QR-kode peger direkte på en stage-URL:

```
https://alma2086.babehill.com/s/fyrrum
```

Ingen global app-state nødvendig — scanning åbner straks det rigtige kapitel.

### Push events (foundation)

`lib/push-events.ts` indeholder placeholder-struktur til fremtidige afbrydelser:

```typescript
{ trigger: 'time', delaySeconds: 45, displayText: '...', speechText: '...' }
```

Ingen runtime endnu — kun datastruktur.

---

## Arkitektur

```
Browser (/s/[stage])
  └─ AlmaChat.tsx
       ├─ localStorage session per stage
       ├─ MediaRecorder
       └─ POST /api/talk
            ├─ currentStage + hintLevel
            ├─ audio → Whisper → transcript
            ├─ buildSystemPrompt(stage) + history → OpenAI → { displayText, speechText }
            └─ speechText → ElevenLabs eleven_v3 → audioBase64
```

### API: `POST /api/talk`

**Request (multipart/form-data):**

| Felt | Type | Beskrivelse |
|------|------|-------------|
| `audio` | File | WebM/Opus-lydoptagelse |
| `history` | string (JSON) | Seneste beskeder (displayText for Alma) |
| `currentStage` | string | Stage-id, fx `fyrrum` |
| `hintLevel` | string | Antal hints allerede givet (0–3) |

**Response (JSON):**

```json
{
  "transcript": "Vi kan ikke finde det",
  "displayText": "Shh... kig hvor det er varmest.",
  "speechText": "[whispers] Shh... [nervous] kig hvor det er varmest.",
  "audioBase64": "...",
  "mimeType": "audio/mpeg",
  "currentStage": "fyrrum",
  "hintLevel": 1,
  "hintGiven": true
}
```

---

## Filstruktur (story-relevant)

```
lib/
  stages.ts              ← al story-data (admin-ready)
  build-system-prompt.ts ← dynamisk prompt
  push-events.ts         ← fremtidige afbrydelser
  session.ts             ← localStorage helpers
app/
  s/[stage]/page.tsx     ← QR-ready routes
  api/talk/route.ts      ← tale-API med stage-kontekst
  api/debug/prompt/      ← dev-only prompt preview
components/
  AlmaChat.tsx           ← UI + session + hints
  SignalLost.tsx
  DebugPanel.tsx         ← kun i development
```

---

## Miljøvariabler

| Variabel | Påkrævet | Standard | Beskrivelse |
|----------|----------|---------|-------------|
| `OPENAI_API_KEY` | Ja | — | OpenAI API-nøgle |
| `OPENAI_MODEL` | Nej | `gpt-4o-mini` | Chat-model |
| `OPENAI_TRANSCRIPTION_MODEL` | Nej | `whisper-1` | Whisper-model |
| `ELEVENLABS_API_KEY` | Ja | — | ElevenLabs API-nøgle |
| `ELEVENLABS_VOICE_ID` | Ja | — | ElevenLabs Voice ID for Alma |

---

## Kendte begrænsninger

- Session gemmes kun i browserens localStorage (ryddes ved clear data)
- Ingen login eller adgangskontrol
- Push events er kun datastruktur — ikke aktiveret endnu
- Lydoptagelse kræver HTTPS i produktion (håndteres af Nginx Proxy Manager)
