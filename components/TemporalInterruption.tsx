'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ActiveInterruption } from '@/hooks/useTemporalInterruptions';
import { playInterruptionGlitch, vibrateInterruption } from '@/lib/interruption-audio';
import type { InterruptionIntensity } from '@/lib/interruptions';
import { unlockTransitionAudio } from '@/lib/transition-audio';

type Phase = 'incoming' | 'playing' | 'tap' | 'exit';

interface TemporalInterruptionProps {
  payload: ActiveInterruption;
  onComplete: (lines: { displayText: string }[]) => void;
  onDismiss: () => void;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export default function TemporalInterruption({
  payload,
  onComplete,
  onDismiss,
}: TemporalInterruptionProps) {
  const intensity: InterruptionIntensity = payload.def.intensity ?? 'normal';
  const [phase, setPhase] = useState<Phase>('incoming');
  const [lineIndex, setLineIndex] = useState(-1);
  const [glitch, setGlitch] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ranRef = useRef(false);

  const currentLine =
    lineIndex >= 0 ? payload.segments[lineIndex]?.displayText : null;

  const playSegment = useCallback(
    async (src: string | null): Promise<boolean> => {
      if (!src) {
        await wait(2200);
        return true;
      }

      if (!audioRef.current) audioRef.current = new Audio();
      const audio = audioRef.current;
      audio.pause();
      audio.currentTime = 0;
      audio.src = src;

      return new Promise((resolve) => {
        audio.onended = () => resolve(true);
        audio.onerror = () => resolve(false);
        audio
          .play()
          .then(() => resolve(true))
          .catch(() => resolve(false));
      });
    },
    [],
  );

  const runSequence = useCallback(async () => {
    if (ranRef.current) return;
    ranRef.current = true;

    await unlockTransitionAudio();
    void playInterruptionGlitch(intensity);
    vibrateInterruption(intensity);
    setPhase('incoming');
    await wait(intensity === 'strong' ? 1400 : 1100);

    for (let i = 0; i < payload.segments.length; i++) {
      setGlitch(true);
      window.setTimeout(() => setGlitch(false), 200);
      setLineIndex(i);
      setPhase('playing');

      const lineDef = payload.def.lines[i];
      const played = await playSegment(payload.segments[i]?.audioSrc ?? null);

      if (!played && i === 0) {
        setPhase('tap');
        await new Promise<void>((resolve) => {
          const handler = async () => {
            document.removeEventListener('pointerdown', handler);
            await unlockTransitionAudio();
            const retry = await playSegment(payload.segments[i]?.audioSrc ?? null);
            if (!retry) await wait(2000);
            resolve();
          };
          document.addEventListener('pointerdown', handler, { once: true });
        });
        setPhase('playing');
      }

      const pause = lineDef?.pauseAfterMs ?? 400;
      await wait(pause);
    }

    setPhase('exit');
    await wait(400);
    onComplete(payload.segments.map((s) => ({ displayText: s.displayText })));
    onDismiss();
  }, [intensity, payload, playSegment, onComplete, onDismiss]);

  useEffect(() => {
    void runSequence();
    return () => {
      audioRef.current?.pause();
    };
  }, [runSequence]);

  const handleTap = useCallback(() => {
    if (phase === 'tap') return;
    if (phase === 'incoming' || phase === 'playing') {
      audioRef.current?.pause();
      setPhase('exit');
      window.setTimeout(() => {
        onComplete(payload.segments.map((s) => ({ displayText: s.displayText })));
        onDismiss();
      }, 280);
    }
  }, [phase, payload, onComplete, onDismiss]);

  return (
    <div
      className={`temporal-interruption temporal-interruption--${intensity}${glitch ? ' temporal-interruption--glitch' : ''}${phase === 'exit' ? ' temporal-interruption--exit' : ''}`}
      role="alertdialog"
      aria-label="Indgående tidsignal fra Alma"
      onClick={handleTap}
    >
      <div className="temporal-interruption-noise" aria-hidden="true" />
      <div className="temporal-interruption-scanlines" aria-hidden="true" />

      <div className="temporal-interruption-inner">
        {(phase === 'incoming' || (phase === 'playing' && lineIndex < 0)) && (
          <p className="temporal-interruption-banner temporal-interruption-flicker">
            INCOMING TEMPORAL SIGNAL
          </p>
        )}

        {phase === 'tap' && (
          <p className="temporal-interruption-tap">Tryk for at høre Alma</p>
        )}

        {currentLine && phase === 'playing' && (
          <p className="temporal-interruption-line temporal-interruption-flicker">{currentLine}</p>
        )}

        {phase !== 'exit' && phase !== 'tap' && lineIndex >= 0 && (
          <p className="temporal-interruption-source">ALMA · 2086</p>
        )}
      </div>
    </div>
  );
}
