'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getInterruptionsForStage,
  type InterruptionDef,
  type InterruptionIntensity,
} from '@/lib/interruptions';
import {
  getFiredInterruptionIds,
  hasInterruptionFired,
  markInterruptionFired,
  clearInterruptionFlag,
} from '@/lib/interruption-storage';
import type { StageId } from '@/lib/stages';

export interface InterruptionSegment {
  displayText: string;
  audioSrc: string | null;
}

export interface ActiveInterruption {
  def: InterruptionDef;
  segments: InterruptionSegment[];
  triggerSource: string;
}

export interface InterruptionDebugState {
  firedIds: string[];
  pendingTimers: { id: string; trigger: string; firesInMs: number }[];
  activeId: string | null;
  lastTrigger: string | null;
  history: { id: string; at: string; source: string }[];
}

interface UseTemporalInterruptionsOptions {
  stageId: StageId;
  enabled: boolean;
  messageCount: number;
  hintLevel: number;
}

export function useTemporalInterruptions({
  stageId,
  enabled,
  messageCount,
  hintLevel,
}: UseTemporalInterruptionsOptions) {
  const [active, setActive] = useState<ActiveInterruption | null>(null);
  const [debugState, setDebugState] = useState<InterruptionDebugState>({
    firedIds: [],
    pendingTimers: [],
    activeId: null,
    lastTrigger: null,
    history: [],
  });

  const activeRef = useRef(false);
  const lastActivityRef = useRef(Date.now());
  const timersRef = useRef<number[]>([]);
  const inactivityIntervalRef = useRef<number | null>(null);
  const messageCountRef = useRef(messageCount);
  const hintLevelRef = useRef(hintLevel);
  const historyRef = useRef<InterruptionDebugState['history']>([]);

  useEffect(() => {
    messageCountRef.current = messageCount;
  }, [messageCount]);

  useEffect(() => {
    hintLevelRef.current = hintLevel;
  }, [hintLevel]);

  const refreshDebug = useCallback(
    (pending: { id: string; trigger: string; firesAt: number }[] = []) => {
      setDebugState({
        firedIds: getFiredInterruptionIds(stageId),
        pendingTimers: pending.map((p) => ({
          id: p.id,
          trigger: p.trigger,
          firesInMs: Math.max(0, p.firesAt - Date.now()),
        })),
        activeId: activeRef.current ? active?.def.id ?? null : null,
        lastTrigger: debugState.lastTrigger,
        history: historyRef.current.slice(-8),
      });
    },
    [stageId, active?.def.id, debugState.lastTrigger],
  );

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
    if (inactivityIntervalRef.current !== null) {
      window.clearInterval(inactivityIntervalRef.current);
      inactivityIntervalRef.current = null;
    }
  }, []);

  const fetchAndFire = useCallback(
    async (def: InterruptionDef, triggerSource: string) => {
      if (activeRef.current) return;
      if (hasInterruptionFired(stageId, def.id)) return;

      activeRef.current = true;
      markInterruptionFired(stageId, def.id);

      historyRef.current = [
        ...historyRef.current,
        { id: def.id, at: new Date().toISOString(), source: triggerSource },
      ].slice(-12);

      let segments: InterruptionSegment[] = def.lines.map((l) => ({
        displayText: l.displayText,
        audioSrc: null,
      }));

      try {
        const res = await fetch('/api/interruption', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lines: def.lines }),
        });
        const data = await res.json();
        if (res.ok && Array.isArray(data.segments)) {
          segments = data.segments.map(
            (s: { displayText: string; audioBase64: string; mimeType: string }) => ({
              displayText: s.displayText,
              audioSrc: `data:${s.mimeType};base64,${s.audioBase64}`,
            }),
          );
        }
      } catch {
        // vis tekst uden lyd
      }

      setActive({ def, segments, triggerSource });
      setDebugState((prev) => ({
        ...prev,
        firedIds: getFiredInterruptionIds(stageId),
        activeId: def.id,
        lastTrigger: triggerSource,
        history: historyRef.current.slice(-8),
      }));
    },
    [stageId],
  );

  const schedule = useCallback(
    (defs: InterruptionDef[]) => {
      clearTimers();
      const pending: { id: string; trigger: string; firesAt: number }[] = [];

      for (const def of defs) {
        if (hasInterruptionFired(stageId, def.id)) continue;

        if (def.trigger === 'stage_enter' || def.trigger === 'timer' || def.trigger === 'after_image') {
          const delay = def.delayMs ?? 0;
          const firesAt = Date.now() + delay;
          pending.push({ id: def.id, trigger: def.trigger, firesAt });
          const id = window.setTimeout(() => {
            if (!activeRef.current) void fetchAndFire(def, def.trigger);
          }, delay);
          timersRef.current.push(id);
        }

        if (def.trigger === 'inactivity' || def.trigger === 'stuck') {
          pending.push({
            id: def.id,
            trigger: def.trigger,
            firesAt: Date.now() + (def.inactivityMs ?? 75000),
          });
        }
      }

      if (defs.some((d) => d.trigger === 'inactivity' || d.trigger === 'stuck')) {
        inactivityIntervalRef.current = window.setInterval(() => {
          if (activeRef.current || !enabled) return;

          const idleFor = Date.now() - lastActivityRef.current;

          for (const def of defs) {
            if (hasInterruptionFired(stageId, def.id)) continue;

            if (def.trigger === 'inactivity' && def.inactivityMs && idleFor >= def.inactivityMs) {
              void fetchAndFire(def, 'inactivity');
              return;
            }

            if (
              def.trigger === 'stuck' &&
              def.inactivityMs &&
              idleFor >= def.inactivityMs &&
              messageCountRef.current >= (def.minMessages ?? 2) &&
              hintLevelRef.current === 0
            ) {
              void fetchAndFire(def, 'stuck');
              return;
            }
          }
        }, 4000);
      }

      refreshDebug(pending);
      const debugInterval = window.setInterval(() => refreshDebug(pending), 2000);
      timersRef.current.push(debugInterval);
    },
    [stageId, enabled, clearTimers, fetchAndFire, refreshDebug],
  );

  const scheduledRef = useRef(false);

  useEffect(() => {
    if (!enabled) {
      clearTimers();
      scheduledRef.current = false;
      return;
    }

    if (scheduledRef.current) return;
    scheduledRef.current = true;
    lastActivityRef.current = Date.now();
    schedule(getInterruptionsForStage(stageId));

    return () => {
      clearTimers();
      scheduledRef.current = false;
    };
  }, [stageId, enabled, schedule, clearTimers]);

  const notifyActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  const notifyAfterImage = useCallback(() => {
    notifyActivity();
    const defs = getInterruptionsForStage(stageId).filter((d) => d.trigger === 'after_image');
    for (const def of defs) {
      if (hasInterruptionFired(stageId, def.id)) continue;
      const id = window.setTimeout(() => {
        if (!activeRef.current) void fetchAndFire(def, 'after_image');
      }, def.delayMs ?? 8000);
      timersRef.current.push(id);
    }
  }, [stageId, fetchAndFire, notifyActivity]);

  const dismiss = useCallback(() => {
    activeRef.current = false;
    setActive(null);
    refreshDebug();
  }, [refreshDebug]);

  const forceTrigger = useCallback(
    async (interruptionId: string) => {
      const def = getInterruptionsForStage(stageId).find((d) => d.id === interruptionId);
      if (!def || activeRef.current) return;
      clearInterruptionFlag(stageId, interruptionId);
      await fetchAndFire(def, 'debug');
    },
    [stageId, fetchAndFire],
  );

  const isActive = active !== null;

  return {
    activeInterruption: active,
    isInterruptionActive: isActive,
    dismissInterruption: dismiss,
    notifyActivity,
    notifyAfterImage,
    forceTrigger,
    debugInterruptionState: debugState,
  };
}
