'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { isBriefingConfirmation } from '@/lib/briefing-detect';
import { consumeQrStageEntry, type QrScanMode } from '@/lib/qr-entry';
import { playInterruptionGlitch, vibrateInterruption } from '@/lib/interruption-audio';
import { fetchSceneLineAudio, playSceneLines } from '@/lib/scene-playback';
import type { SceneState } from '@/lib/scene-state';
import { isSceneClosed, isSceneInteractive } from '@/lib/scene-state';
import type { StageDefinition } from '@/lib/stages';

export type SceneFlowPhase = 'idle' | 'script' | 'collapse' | 'done';

interface UseSceneFlowOptions {
  stage: StageDefinition;
  /** Fallback når /s/[stage]/fundet åbnes uden sessionStorage */
  initialQrMode?: QrScanMode;
  transitionDone: boolean;
  sessionLoaded: boolean;
  sceneState: SceneState;
  hasArrived: boolean;
  clueFound: boolean;
  arrivalPlayed: boolean;
  briefingConfirmed: boolean;
  onPatchSession: (patch: {
    sceneState?: SceneState;
    hasArrived?: boolean;
    clueFound?: boolean;
    arrivalPlayed?: boolean;
    searchUserMessages?: number;
    briefingUserMessages?: number;
    briefingConfirmed?: boolean;
  }) => void;
  onAppendMessages: (lines: { displayText: string }[]) => void;
  getAudioElement: () => HTMLAudioElement;
  unlockAudio: () => void;
}

export function useSceneFlow({
  stage,
  initialQrMode,
  transitionDone,
  sessionLoaded,
  sceneState,
  hasArrived,
  clueFound,
  arrivalPlayed,
  briefingConfirmed,
  onPatchSession,
  onAppendMessages,
  getAudioElement,
  unlockAudio,
}: UseSceneFlowOptions) {
  const [flowPhase, setFlowPhase] = useState<SceneFlowPhase>('idle');
  const [scriptLine, setScriptLine] = useState<string | null>(null);
  const [showCollapse, setShowCollapse] = useState(false);
  const [awaitingAudioUnlock, setAwaitingAudioUnlock] = useState(false);
  const [awaitingEntrance, setAwaitingEntrance] = useState(false);
  const runningRef = useRef(false);
  const bootstrappedRef = useRef(false);
  const pendingQrRef = useRef<QrScanMode | null>(null);

  const playScriptLines = useCallback(
    async (lines: readonly { displayText: string; speechText: string; pauseAfterMs?: number }[]) => {
      if (runningRef.current || lines.length === 0) return;
      runningRef.current = true;
      setFlowPhase('script');
      unlockAudio();

      const segments = await fetchSceneLineAudio([...lines]);
      const audio = getAudioElement();
      await playSceneLines([...lines], segments, audio, (text) => setScriptLine(text));
      onAppendMessages(lines.map((l) => ({ displayText: l.displayText })));
      setScriptLine(null);
      runningRef.current = false;
      setFlowPhase('idle');
    },
    [getAudioElement, unlockAudio, onAppendMessages],
  );

  const beginCollapse = useCallback(async () => {
    if (runningRef.current) return;
    runningRef.current = true;
    setFlowPhase('collapse');
    setShowCollapse(true);
    void playInterruptionGlitch('strong');
    vibrateInterruption('strong');
    onPatchSession({ sceneState: 'transition' });
    await new Promise((r) => setTimeout(r, 2200));
    runningRef.current = false;
  }, [onPatchSession]);

  const finishCollapse = useCallback(() => {
    setShowCollapse(false);
    setFlowPhase('done');
    onPatchSession({ sceneState: 'completed' });
  }, [onPatchSession]);

  const beginTransition = useCallback(async () => {
    if (sceneState === 'transition' || sceneState === 'completed' || briefingConfirmed) return;
    onPatchSession({ briefingConfirmed: true, sceneState: 'transition' });
    await playScriptLines([...stage.scene.transitionDialogue]);
    await beginCollapse();
  }, [
    sceneState,
    briefingConfirmed,
    onPatchSession,
    playScriptLines,
    stage.scene.transitionDialogue,
    beginCollapse,
  ]);

  const runClueFound = useCallback(async () => {
    if (!stage.scene.requiresClueQr) return;
    if (!hasArrived) {
      setAwaitingEntrance(true);
      return;
    }
    if (clueFound && sceneState === 'briefing') return;

    const lines = stage.scene.clueFoundDialogue;
    if (lines.length > 0) {
      onPatchSession({ sceneState: 'reaction' });
      await playScriptLines([...lines]);
    }
    onPatchSession({ clueFound: true, sceneState: 'briefing' });
  }, [stage, hasArrived, clueFound, sceneState, onPatchSession, playScriptLines]);

  const runArrival = useCallback(async () => {
    if (arrivalPlayed || sceneState !== 'arrival') return;

    if (stage.scene.requiresClueQr && !hasArrived) {
      setAwaitingEntrance(true);
      return;
    }

    setAwaitingAudioUnlock(false);
    setAwaitingEntrance(false);

    await playScriptLines([...stage.scene.entranceArrivalDialogue]);
    const isFinaleEpilogue = stage.id === 'finale';
    onPatchSession({
      arrivalPlayed: true,
      hasArrived: true,
      clueFound: isFinaleEpilogue ? true : undefined,
      sceneState: isFinaleEpilogue ? 'briefing' : 'search',
    });
  }, [arrivalPlayed, sceneState, stage, hasArrived, onPatchSession, playScriptLines]);

  useEffect(() => {
    if (!transitionDone || !sessionLoaded || bootstrappedRef.current) return;
    bootstrappedRef.current = true;

    if (isSceneClosed(sceneState)) {
      setFlowPhase('done');
      return;
    }

    const qrMode = consumeQrStageEntry(stage.id) ?? initialQrMode ?? null;
    pendingQrRef.current = qrMode;

    if (qrMode === 'ankomst') {
      onPatchSession({ hasArrived: true });
    }

    if (qrMode === 'fundet' && stage.scene.requiresClueQr) {
      if (!hasArrived) {
        setAwaitingEntrance(true);
        return;
      }
      if (!clueFound) {
        setAwaitingAudioUnlock(true);
      }
      return;
    }

    if (clueFound && sceneState === 'search') {
      onPatchSession({ sceneState: 'briefing' });
      return;
    }

    if (sceneState === 'briefing' || sceneState === 'search' || sceneState === 'reaction') {
      return;
    }

    if (sceneState === 'arrival' && !arrivalPlayed) {
      if (stage.scene.requiresClueQr && !hasArrived && qrMode !== 'ankomst') {
        setAwaitingEntrance(true);
        return;
      }
      setAwaitingAudioUnlock(true);
      return;
    }

    if (sceneState === 'arrival' && arrivalPlayed && hasArrived) {
      onPatchSession({ sceneState: 'search' });
    }
  }, [
    transitionDone,
    sessionLoaded,
    sceneState,
    arrivalPlayed,
    hasArrived,
    clueFound,
    stage.id,
    stage.scene.requiresClueQr,
    initialQrMode,
    onPatchSession,
  ]);

  const handleAudioUnlock = useCallback(() => {
    unlockAudio();
    const mode = pendingQrRef.current;
    pendingQrRef.current = null;

    if (mode === 'fundet' && stage.scene.requiresClueQr) {
      void runClueFound();
      return;
    }
    void runArrival();
  }, [unlockAudio, stage.scene.requiresClueQr, runClueFound, runArrival]);

  const canTalk =
    transitionDone &&
    sessionLoaded &&
    isSceneInteractive(sceneState) &&
    flowPhase === 'idle' &&
    !showCollapse &&
    !awaitingAudioUnlock &&
    !awaitingEntrance &&
    (sceneState !== 'search' || hasArrived || !stage.scene.requiresClueQr);

  const isSceneBusy =
    flowPhase === 'script' ||
    flowPhase === 'collapse' ||
    showCollapse ||
    awaitingAudioUnlock;

  const transitionDelayMs = stage.scene.transitionDelayMs ?? 2800;

  const onSearchMessage = useCallback(
    (count: number) => {
      onPatchSession({ searchUserMessages: count });
      if (
        sceneState === 'search' &&
        !stage.scene.requiresClueQr &&
        count >= stage.scene.minSearchExchanges
      ) {
        onPatchSession({ sceneState: 'briefing' });
      }
    },
    [sceneState, stage.scene.minSearchExchanges, stage.scene.requiresClueQr, onPatchSession],
  );

  const onBriefingMessage = useCallback(
    (transcript: string, count: number) => {
      onPatchSession({ briefingUserMessages: count });
      if (sceneState !== 'briefing' || briefingConfirmed) return;

      const confirmed = isBriefingConfirmation(transcript);
      const enough = count >= stage.scene.minBriefingExchanges;
      if (confirmed && enough) {
        window.setTimeout(() => void beginTransition(), transitionDelayMs);
      }
    },
    [
      sceneState,
      briefingConfirmed,
      stage.scene.minBriefingExchanges,
      onPatchSession,
      beginTransition,
      transitionDelayMs,
    ],
  );

  return {
    flowPhase,
    scriptLine,
    showCollapse,
    awaitingAudioUnlock,
    awaitingEntrance,
    unlockAndStartArrival: handleAudioUnlock,
    canTalk,
    isSceneBusy,
    isSceneCompleted: isSceneClosed(sceneState) || flowPhase === 'done',
    onSearchMessage,
    onBriefingMessage,
    beginTransition,
    finishCollapse,
  };
}
