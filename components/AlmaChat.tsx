'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import ConnectionStability from '@/components/ConnectionStability';
import DebugPanel from '@/components/DebugPanel';
import ShowAlmaCamera from '@/components/ShowAlmaCamera';
import StageTransition from '@/components/StageTransition';
import { mimeToUploadFilename } from '@/lib/audio-upload';
import { loadStageSession, saveStageSession, type ChatMessage } from '@/lib/session';
import { canShowAlma } from '@/lib/show-alma-stages';
import type { StageDefinition } from '@/lib/stages';

const QrScanner = dynamic(() => import('@/components/QrScanner'), { ssr: false });

type Message = ChatMessage & {
  audioSrc?: string;
};

type ApiHistory = {
  role: 'user' | 'assistant';
  content: string;
};

type Status =
  | 'idle'
  | 'recording'
  | 'connecting'
  | 'thinking'
  | 'speaking'
  | 'sending-image'
  | 'analyzing-image'
  | 'error';

interface TalkApiResponse {
  transcript: string;
  displayText: string;
  speechText?: string;
  audioBase64: string;
  mimeType: string;
  currentStage?: string;
  hintLevel?: number;
  hintGiven?: boolean;
  systemPromptPreview?: string;
  error?: string;
}

interface AlmaChatProps {
  stage: StageDefinition;
}

interface ShowAlmaApiResponse {
  displayText: string;
  speechText?: string;
  visionDescription?: string;
  audioBase64: string;
  mimeType: string;
  systemPromptPreview?: string;
  rawModelResponse?: string;
  error?: string;
}

const STATUS_LABELS: Record<Status, string> = {
  idle: 'Tryk og hold for at tale med Alma',
  recording: 'Optager… tal nu',
  connecting: 'Forbinder til 2086…',
  thinking: 'Alma svarer…',
  speaking: 'Alma taler…',
  'sending-image': 'Sender til 2086…',
  'analyzing-image': 'Alma analyserer signalet…',
  error: 'Forbindelsesfejl',
};

const BUTTON_ICONS: Record<Status, string> = {
  idle: '🎙',
  recording: '🔴',
  connecting: '📡',
  thinking: '⏳',
  speaking: '🔊',
  'sending-image': '📡',
  'analyzing-image': '👁',
  error: '⚠',
};

const SILENT_WAV =
  'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';

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
  return messages.slice(-12).map((m) => ({
    role: m.role === 'alma' ? 'assistant' : 'user',
    content: m.text,
  }));
}

export default function AlmaChat({ stage }: AlmaChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [hintLevel, setHintLevel] = useState(0);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isHolding, setIsHolding] = useState(false);
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [lastPromptPreview, setLastPromptPreview] = useState<string | null>(null);
  const [lastVisionDescription, setLastVisionDescription] = useState<string | null>(null);
  const [lastRawVisionResponse, setLastRawVisionResponse] = useState<string | null>(null);
  const [qrOpen, setQrOpen] = useState(false);
  const [showAlmaOpen, setShowAlmaOpen] = useState(false);
  const [transitionDone, setTransitionDone] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const playbackRef = useRef<HTMLAudioElement | null>(null);
  const unlockRef = useRef<HTMLAudioElement | null>(null);
  const chatLogRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<Message[]>(messages);
  const hintLevelRef = useRef(hintLevel);
  const visitedAtRef = useRef<string>(new Date().toISOString());

  const getPlaybackElement = useCallback(() => {
    if (!playbackRef.current) playbackRef.current = new Audio();
    return playbackRef.current;
  }, []);

  const clearPlaybackHandlers = useCallback((audio: HTMLAudioElement) => {
    audio.onended = null;
    audio.onerror = null;
  }, []);

  const unlockAudio = useCallback(() => {
    const playback = getPlaybackElement();
    playback.pause();
    clearPlaybackHandlers(playback);

    if (!unlockRef.current) unlockRef.current = new Audio();
    const unlock = unlockRef.current;
    unlock.onerror = null;
    unlock.onended = null;
    unlock.pause();
    unlock.muted = true;
    unlock.src = SILENT_WAV;
    unlock
      .play()
      .then(() => {
        unlock.pause();
        unlock.currentTime = 0;
        unlock.muted = false;
        unlock.removeAttribute('src');
      })
      .catch(() => {
        unlock.muted = false;
      });
  }, [getPlaybackElement, clearPlaybackHandlers]);

  const playAlmaAudio = useCallback(
    async (audioSrc: string, messageIndex?: number) => {
      const audio = getPlaybackElement();
      clearPlaybackHandlers(audio);
      audio.pause();
      audio.currentTime = 0;
      audio.muted = false;
      audio.src = audioSrc;

      setStatus('speaking');
      setError(null);

      audio.onended = () => {
        clearPlaybackHandlers(audio);
        setStatus('idle');
        if (messageIndex !== undefined) {
          setMessages((prev) =>
            prev.map((m, i) => (i === messageIndex ? { ...m, audioSrc: undefined } : m)),
          );
        }
      };
      audio.onerror = () => {
        clearPlaybackHandlers(audio);
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
        return false;
      }
      return true;
    },
    [getPlaybackElement, clearPlaybackHandlers],
  );

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    hintLevelRef.current = hintLevel;
  }, [hintLevel]);

  useEffect(() => {
    const session = loadStageSession(stage.id);
    setMessages(session.messages);
    setHintLevel(session.hintLevel);
    visitedAtRef.current = session.visitedAt;
    setSessionLoaded(true);
  }, [stage.id]);

  useEffect(() => {
    if (!sessionLoaded) return;
    saveStageSession(stage.id, {
      messages: messages.map(({ role, text }) => ({ role, text })),
      hintLevel,
      visitedAt: visitedAtRef.current,
      updatedAt: new Date().toISOString(),
    });
  }, [messages, hintLevel, stage.id, sessionLoaded]);

  useEffect(() => {
    if (chatLogRef.current) {
      chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    return () => {
      playbackRef.current?.pause();
      unlockRef.current?.pause();
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

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

  const stopAndSend = useCallback(async () => {
    if (!isHolding) return;
    setIsHolding(false);

    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === 'inactive') return;

    setStatus('connecting');

    await new Promise<void>((resolve) => {
      recorder.onstop = () => resolve();
      recorder.stop();
    });

    streamRef.current?.getTracks().forEach((t) => t.stop());

    const mimeType = recorder.mimeType || 'audio/webm';
    const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
    const uploadFilename = mimeToUploadFilename(mimeType);

    if (audioBlob.size < 2000) {
      setError('Optagelsen var for kort. Hold knappen lidt længere.');
      setStatus('idle');
      return;
    }

    const formData = new FormData();
    formData.append('audio', audioBlob, uploadFilename);
    formData.append('audioMime', mimeType);
    formData.append('history', JSON.stringify(toApiHistory(messagesRef.current)));
    formData.append('currentStage', stage.id);
    formData.append('hintLevel', String(hintLevelRef.current));

    try {
      setStatus('thinking');

      const res = await fetch('/api/talk', { method: 'POST', body: formData });
      const data: TalkApiResponse = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      if (data.systemPromptPreview) {
        setLastPromptPreview(data.systemPromptPreview);
      }

      if (typeof data.hintLevel === 'number') {
        setHintLevel(data.hintLevel);
      }

      const { transcript, displayText, audioBase64, mimeType: audioMime } = data;
      const audioSrc = `data:${audioMime};base64,${audioBase64}`;

      let almaMessageIndex = 0;
      setMessages((prev) => {
        almaMessageIndex = prev.length + 1;
        return [
          ...prev,
          { role: 'user', text: transcript },
          { role: 'alma', text: displayText, audioSrc },
        ];
      });

      const played = await playAlmaAudio(audioSrc, almaMessageIndex);
      if (!played) setStatus('idle');
    } catch (err) {
      console.error('[AlmaChat] API error:', err);
      const msg = err instanceof Error ? err.message : 'Ukendt fejl fra serveren';
      setError(msg);
      setStatus('error');
    }
  }, [isHolding, stage.id, playAlmaAudio]);

  const handleShowAlmaSend = useCallback(
    async (imageBlob: Blob) => {
      setShowAlmaOpen(false);
      setError(null);
      setStatus('sending-image');

      const formData = new FormData();
      formData.append('image', imageBlob, 'photo.jpg');
      formData.append('currentStage', stage.id);
      formData.append('history', JSON.stringify(toApiHistory(messagesRef.current)));

      try {
        setStatus('analyzing-image');
        const res = await fetch('/api/show-alma', { method: 'POST', body: formData });
        const data: ShowAlmaApiResponse = await res.json();

        if (!res.ok || data.error) {
          throw new Error(data.error || `HTTP ${res.status}`);
        }

        if (data.systemPromptPreview) setLastPromptPreview(data.systemPromptPreview);
        if (data.visionDescription) setLastVisionDescription(data.visionDescription);
        if (data.rawModelResponse) setLastRawVisionResponse(data.rawModelResponse);

        const { displayText, audioBase64, mimeType: audioMime } = data;
        const audioSrc = `data:${audioMime};base64,${audioBase64}`;

        let almaMessageIndex = 0;
        setMessages((prev) => {
          almaMessageIndex = prev.length + 1;
          return [
            ...prev,
            { role: 'user', text: '📷 Viste Alma stedet' },
            { role: 'alma', text: displayText, audioSrc },
          ];
        });

        const played = await playAlmaAudio(audioSrc, almaMessageIndex);
        if (!played) setStatus('idle');
      } catch (err) {
        console.error('[AlmaChat] Show Alma error:', err);
        const msg = err instanceof Error ? err.message : 'Ukendt fejl fra serveren';
        setError(msg);
        setStatus('error');
      }
    },
    [stage.id, playAlmaAudio],
  );

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

  const isBusy =
    status === 'connecting' ||
    status === 'thinking' ||
    status === 'speaking' ||
    status === 'sending-image' ||
    status === 'analyzing-image';
  const isDisabled = isBusy;
  const talkDisabled = isBusy || status === 'recording';
  const buttonLabel = isHolding ? 'SLIP FOR AT SENDE' : 'HOLD FOR AT TALE';
  return (
    <>
      {!transitionDone && (
        <StageTransition stage={stage} onComplete={() => setTransitionDone(true)} />
      )}
    <div
      className={`alma-container${transitionDone ? ' alma-container--ready' : ' alma-container--hidden'}`}
      aria-hidden={!transitionDone}
    >
      <header className="alma-header">
        <div className="alma-signal">
          <span className="alma-signal-dot" />
          Tidsforbindelse 2026 → 2086
        </div>
        <h1 className="alma-title">ALMA</h1>
        <p className="alma-subtitle">{stage.title}</p>

        <div className="stage-hud">
          <div className="stage-hud-row">
            <span className="stage-hud-label">SIGNAL LOCATION</span>
            <span className="stage-hud-value">{stage.signalLocation}</span>
          </div>
          <ConnectionStability base={stage.connectionStability} />
        </div>
      </header>

      <div className="chat-log" ref={chatLogRef} role="log" aria-live="polite">
        {messages.length === 0 && (
          <div className="chat-empty">
            <p>{stage.description}</p>
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

        <div className="action-row">
          <button
            type="button"
            className="action-btn action-btn--scan"
            onClick={() => setQrOpen(true)}
            disabled={isBusy}
          >
            📡 SCAN SIGNAL
          </button>
          {canShowAlma(stage.id) && (
            <button
              type="button"
              className="action-btn action-btn--show"
              onClick={() => setShowAlmaOpen(true)}
              disabled={isBusy}
            >
              📷 VIS ALMA DET
            </button>
          )}
        </div>

        <button
          className={[
            'talk-button',
            isHolding ? 'talk-button--active' : '',
            talkDisabled ? 'talk-button--disabled' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onPointerCancel={handlePointerUp}
          disabled={talkDisabled}
          aria-label="Hold nede for at tale med Alma"
          aria-pressed={isHolding}
        >
          <span className="talk-button-icon" aria-hidden="true">
            {BUTTON_ICONS[isHolding ? 'recording' : status]}
          </span>
          <span className="talk-button-label">{buttonLabel}</span>
        </button>
      </div>

      {qrOpen && <QrScanner onClose={() => setQrOpen(false)} />}
      {showAlmaOpen && (
        <ShowAlmaCamera
          onClose={() => setShowAlmaOpen(false)}
          onSend={handleShowAlmaSend}
          disabled={isBusy}
        />
      )}

      <DebugPanel
        stage={stage}
        hintLevel={hintLevel}
        messageCount={messages.length}
        systemPromptPreview={lastPromptPreview}
        visionDescription={lastVisionDescription}
        rawVisionResponse={lastRawVisionResponse}
      />
    </div>
    </>
  );
}
