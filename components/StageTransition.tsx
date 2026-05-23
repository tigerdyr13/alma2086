'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  consumePendingTransitionAudio,
  shouldPlayStageTransition,
  vibrateOnLinkEstablished,
} from '@/lib/stage-transition';
import type { StageDefinition } from '@/lib/stages';
import { playTransitionAudio, unlockTransitionAudio } from '@/lib/transition-audio';

type TransitionPhase = 'detect' | 'link' | 'stage' | 'established' | 'exit';

interface StageTransitionProps {
  stage: StageDefinition;
  onComplete: () => void;
}

const PHASE_MS: Record<Exclude<TransitionPhase, 'exit'>, number> = {
  detect: 750,
  link: 850,
  stage: 1100,
  established: 750,
};

const PHASE_ORDER: Exclude<TransitionPhase, 'exit'>[] = ['detect', 'link', 'stage', 'established'];

const PHASE_AUDIO: Record<Exclude<TransitionPhase, 'exit'>, 'detect' | 'link' | 'stage' | 'established' | null> = {
  detect: 'detect',
  link: 'link',
  stage: 'stage',
  established: 'established',
};

export default function StageTransition({ stage, onComplete }: StageTransitionProps) {
  const [active] = useState(() => shouldPlayStageTransition(stage.id));
  const [phase, setPhase] = useState<TransitionPhase>('detect');
  const [visible, setVisible] = useState(true);
  const [canSkip, setCanSkip] = useState(false);
  const [glitch, setGlitch] = useState(false);
  const completedRef = useRef(false);
  const timersRef = useRef<number[]>([]);

  const finish = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
    setPhase('exit');
    setVisible(false);
    window.setTimeout(onComplete, 320);
  }, [onComplete]);

  const playPhaseAudio = useCallback(async (p: Exclude<TransitionPhase, 'exit'>) => {
    const audioPhase = PHASE_AUDIO[p];
    if (audioPhase) {
      await playTransitionAudio(audioPhase);
    }
    if (p === 'established') {
      vibrateOnLinkEstablished();
    }
  }, []);

  const runSequence = useCallback(() => {
    let delay = 0;

    PHASE_ORDER.forEach((p) => {
      const enterId = window.setTimeout(() => {
        setPhase(p);
        if (p === 'link' || p === 'established') {
          setGlitch(true);
          window.setTimeout(() => setGlitch(false), 180);
        }
        void playPhaseAudio(p);
      }, delay);
      timersRef.current.push(enterId);
      delay += PHASE_MS[p];
    });

    const doneId = window.setTimeout(finish, delay + 280);
    timersRef.current.push(doneId);
  }, [finish, playPhaseAudio]);

  useEffect(() => {
    if (!active) {
      onComplete();
      return;
    }

    const skipTimer = window.setTimeout(() => setCanSkip(true), 1000);
    timersRef.current.push(skipTimer);

    void (async () => {
      if (consumePendingTransitionAudio()) {
        await unlockTransitionAudio();
      }
      runSequence();
    })();

    return () => {
      timersRef.current.forEach((id) => window.clearTimeout(id));
      timersRef.current = [];
    };
  }, [active, stage.id, onComplete, runSequence]);

  const handleSkip = useCallback(() => {
    if (!canSkip) return;
    void unlockTransitionAudio();
    finish();
  }, [canSkip, finish]);

  if (!active) return null;
  if (!visible && phase === 'exit') return null;

  return (
    <div
      className={`stage-transition${glitch ? ' stage-transition--glitch' : ''}${phase === 'exit' ? ' stage-transition--exit' : ''}`}
      role="presentation"
      onClick={handleSkip}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') handleSkip();
      }}
    >
      <div className="stage-transition-noise" aria-hidden="true" />
      <div className="stage-transition-scanlines" aria-hidden="true" />
      <div className="stage-transition-vignette" aria-hidden="true" />

      <div className="stage-transition-content">
        {phase === 'detect' && (
          <p className="stage-transition-line stage-transition-line--primary stage-transition-fade-in">
            SIGNAL DETECTED
          </p>
        )}

        {phase === 'link' && (
          <p className="stage-transition-line stage-transition-line--secondary stage-transition-fade-in">
            ESTABLISHING TEMPORAL LINK
            <span className="stage-transition-dots" aria-hidden="true">
              ...
            </span>
          </p>
        )}

        {(phase === 'stage' || phase === 'established') && (
          <div className="stage-transition-stage-block">
            <h2 className="stage-transition-headline stage-transition-fade-in">
              {stage.transitionHeadline}
            </h2>
            <p className="stage-transition-status stage-transition-fade-in">
              {stage.transitionStatus}
            </p>
            {stage.transitionSubline && (
              <p className="stage-transition-subline stage-transition-fade-in">
                {stage.transitionSubline}
              </p>
            )}
          </div>
        )}

        {phase === 'established' && (
          <p className="stage-transition-established stage-transition-fade-in">
            ALMA LINK ESTABLISHED
          </p>
        )}
      </div>

      {canSkip && phase !== 'exit' && (
        <p className="stage-transition-skip">Tryk for at springe over</p>
      )}

      <div className="stage-transition-symbol" aria-hidden="true">
        ◈
      </div>
    </div>
  );
}
