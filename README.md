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

Åbn [http://localhost:3005](http://localhost:3005) i browseren.

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

## Arkitektur

```
Browser
  └─ AlmaChat.tsx
       ├─ MediaRecorder (optager audio som WebM/Opus)
       └─ POST /api/talk  (multipart/form-data)
            ├─ audio → OpenAI Whisper → transcript
            ├─ transcript + history → OpenAI Chat → replyText
            └─ replyText → ElevenLabs TTS → audioBase64
                 └─ Browser afspiller base64-lyd
```

### API: `POST /api/talk`

**Request (multipart/form-data):**

| Felt | Type | Beskrivelse |
|------|------|-------------|
| `audio` | File | WebM/Opus-lydoptagelse |
| `history` | string (JSON) | Array af seneste beskeder til kontekst |

**Response (JSON):**

```json
{
  "transcript": "Hvad hedder du?",
  "replyText": "Jeg hedder Alma! Signalet hakker lidt – kan du høre mig?",
  "audioBase64": "...",
  "mimeType": "audio/mpeg"
}
```

---

## Udvidelse til skattejagt-trin

API-ruten er forberedt til et `stage`-parameter. Når du vil tilføje trin:

1. Tilføj `stage` til `FormData` i `AlmaChat.tsx`
2. Brug `stage` i API-ruten til at justere Almas systemprompt eller hints

```typescript
// Eksempel på stage-baseret systemprompt
const STAGE_HINTS: Record<Stage, string> = {
  intro: '',
  fyrrum: 'Du ved, at børnene er tæt på fyrrummet. Giv hint om varme og rør.',
  // ...
};
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

## Kendte begrænsninger (v1)

- Ingen persistens — samtalen nulstilles ved reload
- Ingen login eller adgangskontrol
- Ingen QR-flow
- Konversationshistorik er kun i-memory i browseren (max 6 beskeder sendes til API)
- Lydoptagelse kræver HTTPS i produktion (håndteres af Nginx Proxy Manager)
