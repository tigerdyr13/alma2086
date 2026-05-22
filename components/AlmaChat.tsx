'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

// ── Typer ──────────────────────────────────────────────────────────────

type Message = {
  role: 'user' | 'alma';
  text: string;
  /** Sættes når browser blokerer autoplay – tryk for at afspille */
  audioSrc?: string;
};

type ApiHistory = {
  role: 'user' | 'assistant';
  content: string;
};

type Status = 'idle' | 'recording' | 'connecting' | 'thinking' | 'speaking' | 'error';

interface TalkApiResponse {
  transcript: string;
  replyText: string;
  audioBase64: string;
  mimeType: string;
  error?: string;
}

// ── Statustekster ──────────────────────────────────────────────────────

const STATUS_LABELS: Record<Status, string> = {
  idle: 'Tryk og hold for at tale med Alma',
  recording: 'Optager… tal nu',
  connecting: 'Forbinder til 2086…',
  thinking: 'Alma svarer…',
  speaking: 'Alma taler…',
  error: 'Forbindelsesfejl',
};

const BUTTON_ICONS: Record<Status, string> = {
  idle: '🎙',
  recording: '🔴',
  connecting: '📡',
  thinking: '⏳',
  speaking: '🔊',
  error: '⚠',
};

// ── Hjælpefunktioner ───────────────────────────────────────────────────

function getBestMimeType(): string {
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/ogg',
    'audio/mp4',
  ];
  for (const type of candidates) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return '';
}

function toApiHistory(messages: Message[]): ApiHistory[] {
  return messages.slice(-6).map((m) => ({
    role: m.role === 'alma' ? 'assistant' : 'user',
    content: m.text,
  }));
}

// Minimal lydløs WAV – bruges til at låse op for afspilning under brugerens tryk
const SILENT_WAV =
  'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';

// ── Komponent ──────────────────────────────────────────────────────────

export default function AlmaChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isHolding, setIsHolding] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const chatLogRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<Message[]>(messages);

  const getAudioElement = useCallback(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    return audioRef.current;
  }, []);

  // Kør synkront ved pointer down – beholdes i browserens "user gesture"-kæde
  const unlockAudio = useCallback(() => {
    const audio = getAudioElement();
    audio.muted = true;
    audio.src = SILENT_WAV;
    audio
      .play()
      .then(() => {
        audio.pause();
        audio.currentTime = 0;
        audio.muted = false;
        audio.removeAttribute('src');
      })
      .catch(() => {
        audio.muted = false;
      });
  }, [getAudioElement]);

  const playAlmaAudio = useCallback(
    async (audioSrc: string, messageIndex?: number) => {
      const audio = getAudioElement();
      audio.src = audioSrc;
      audioRef.current = audio;

      setStatus('speaking');
      setError(null);

      audio.onended = () => {
        setStatus('idle');
        if (messageIndex !== undefined) {
          setMessages((prev) =>
            prev.map((m, i) => (i === messageIndex ? { ...m, audioSrc: undefined } : m)),
          );
        }
      };
      audio.onerror = () => {
        setError('Kunne ikke afspille Almas stemme.');
        setStatus('idle');
      };

      try {
        await audio.play();
        if (messageIndex !== undefined) {
          setMessages((prev) =>
            prev.map((m, i) => (i === messageIndex ? { ...m, audioSrc: undefined } : m)),
          );
        }
      } catch {
        setStatus('idle');
        if (messageIndex !== undefined) return false;
        return false;
      }
      return true;
    },
    [getAudioElement],
  );

  // Hold messagesRef synkroniseret for stabil brug i callbacks
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Auto-scroll til bunden ved nye beskeder
  useEffect(() => {
    if (chatLogRef.current) {
      chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
    }
  }, [messages]);

  // Stop evt. igangværende lyd ved unmount
  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // ── Start optagelse ──────────────────────────────────────────────────

  const startRecording = useCallback(async () => {
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = getBestMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);

      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.start(100);
      mediaRecorderRef.current = recorder;
      setIsHolding(true);
      setStatus('recording');
    } catch (err) {
      console.error('[AlmaChat] Mic error:', err);
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        setError('Mikrofon-adgang nægtet. Giv tilladelse i browser-indstillingerne og prøv igen.');
      } else {
        setError('Kunne ikke starte mikrofonen. Prøv at genindlæse siden.');
      }
      setStatus('error');
    }
  }, []);

  // ── Stop optagelse og send til API ───────────────────────────────────

  const stopAndSend = useCallback(async () => {
    if (!isHolding) return;
    setIsHolding(false);

    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === 'inactive') return;

    setStatus('connecting');

    // Vent på at MediaRecorder er stoppet og alle chunks er samlet
    await new Promise<void>((resolve) => {
      recorder.onstop = () => resolve();
      recorder.stop();
    });

    streamRef.current?.getTracks().forEach((t) => t.stop());

    const mimeType = recorder.mimeType || 'audio/webm';
    const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });

    if (audioBlob.size < 2000) {
      setError('Optagelsen var for kort. Hold knappen lidt længere.');
      setStatus('idle');
      return;
    }

    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    formData.append('history', JSON.stringify(toApiHistory(messagesRef.current)));

    try {
      setStatus('thinking');

      const res = await fetch('/api/talk', { method: 'POST', body: formData });
      const data: TalkApiResponse = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      const { transcript, replyText, audioBase64, mimeType: audioMime } = data;
      const audioSrc = `data:${audioMime};base64,${audioBase64}`;

      let almaMessageIndex = 0;
      setMessages((prev) => {
        almaMessageIndex = prev.length + 1;
        return [
          ...prev,
          { role: 'user', text: transcript },
          { role: 'alma', text: replyText, audioSrc },
        ];
      });

      const played = await playAlmaAudio(audioSrc, almaMessageIndex);
      if (!played) {
        setStatus('idle');
      }
    } catch (err) {
      console.error('[AlmaChat] API error:', err);
      const msg = err instanceof Error ? err.message : 'Ukendt fejl fra serveren';
      setError(msg);
      setStatus('error');
    }
  }, [isHolding]);

  // ── Pointer-events (fungerer på både touch og mus) ───────────────────

  const handlePlayAlmaMessage = useCallback(
    (audioSrc: string, index: number) => {
      void playAlmaAudio(audioSrc, index);
    },
    [playAlmaAudio],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      e.preventDefault();
      if (status !== 'idle' && status !== 'error') return;
      unlockAudio();
      startRecording();
    },
    [status, startRecording, unlockAudio],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      e.preventDefault();
      stopAndSend();
    },
    [stopAndSend],
  );

  const dismissError = useCallback(() => {
    setError(null);
    setStatus('idle');
  }, []);

  const isDisabled = status === 'connecting' || status === 'thinking' || status === 'speaking';
  const buttonLabel = isHolding ? 'SLIP FOR AT SENDE' : 'HOLD FOR AT TALE';

  // ── Render ───────────────────────────────────────────────────────────

  return (
    <div className="alma-container">
      {/* ── Header ── */}
      <header className="alma-header">
        <div className="alma-signal">
          <span className="alma-signal-dot" />
          Tidsforbindelse 2026 → 2086
        </div>
        <h1 className="alma-title">ALMA</h1>
        <p className="alma-subtitle">Fra år 2086</p>
      </header>

      {/* ── Chatlog ── */}
      <div className="chat-log" ref={chatLogRef} role="log" aria-live="polite">
        {messages.length === 0 && (
          <div className="chat-empty">
            <p>Forbindelsen er klar.</p>
            <p>Hold knappen nede og tal med Alma.</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`chat-message chat-message--${msg.role}`}>
            <span className="chat-label">{msg.role === 'user' ? 'DU' : 'ALMA'}</span>
            {msg.role === 'alma' && msg.audioSrc ? (
              <button
                type="button"
                className="chat-text chat-play-button"
                onClick={() => handlePlayAlmaMessage(msg.audioSrc!, i)}
                aria-label="Afspil Almas stemme"
              >
                <span className="chat-play-icon" aria-hidden="true">
                  ▶
                </span>
                {msg.text}
                <span className="chat-play-hint">Tryk for at høre Alma</span>
              </button>
            ) : (
              <p className="chat-text">{msg.text}</p>
            )}
          </div>
        ))}
      </div>

      {/* ── Kontrolpanel ── */}
      <div className="controls">
        {error && (
          <div className="error-banner" role="alert" onClick={dismissError}>
            ⚠ {error} <span className="error-dismiss">(tryk for at lukke)</span>
          </div>
        )}

        <div className="status-bar" aria-live="polite">
          <span className={`status-indicator status-indicator--${status}`} aria-hidden="true" />
          <span className="status-text">{STATUS_LABELS[status]}</span>
        </div>

        <button
          className={[
            'talk-button',
            isHolding ? 'talk-button--active' : '',
            isDisabled ? 'talk-button--disabled' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onPointerCancel={handlePointerUp}
          disabled={isDisabled}
          aria-label="Hold nede for at tale med Alma"
          aria-pressed={isHolding}
        >
          <span className="talk-button-icon" aria-hidden="true">
            {BUTTON_ICONS[isHolding ? 'recording' : status]}
          </span>
          <span className="talk-button-label">{buttonLabel}</span>
        </button>
      </div>
    </div>
  );
}
