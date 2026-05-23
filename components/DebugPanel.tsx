'use client';

import { useEffect, useState } from 'react';
import { getInterruptionsForStage } from '@/lib/interruptions';
import type { InterruptionDebugState } from '@/hooks/useTemporalInterruptions';
import type { StageDefinition } from '@/lib/stages';
import { getActiveHintCount } from '@/lib/stages';

interface DebugPanelProps {
  stage: StageDefinition;
  hintLevel: number;
  messageCount: number;
  systemPromptPreview?: string | null;
  visionDescription?: string | null;
  rawVisionResponse?: string | null;
  interruptionDebug?: InterruptionDebugState;
  onForceInterruption?: (id: string) => void;
  sceneState?: string;
  hasArrived?: boolean;
  clueFound?: boolean;
  searchUserMessages?: number;
  briefingUserMessages?: number;
}

export default function DebugPanel({
  stage,
  hintLevel,
  messageCount,
  systemPromptPreview,
  visionDescription,
  rawVisionResponse,
  interruptionDebug,
  onForceInterruption,
  sceneState,
  hasArrived,
  clueFound,
  searchUserMessages,
  briefingUserMessages,
}: DebugPanelProps) {
  const [open, setOpen] = useState(false);
  const [fetchedPrompt, setFetchedPrompt] = useState<string | null>(null);

  useEffect(() => {
    if (!open || systemPromptPreview) return;

    const params = new URLSearchParams({
      stage: stage.id,
      hintLevel: String(hintLevel),
      sceneState: sceneState ?? 'search',
      clueFound: clueFound ? '1' : '0',
      searchUserMessages: String(searchUserMessages ?? 0),
      briefingUserMessages: String(briefingUserMessages ?? 0),
    });
    fetch(`/api/debug/prompt?${params}`)
      .then((r) => r.json())
      .then((data) => {
        if (typeof data.systemPrompt === 'string') {
          setFetchedPrompt(data.systemPrompt);
        }
      })
      .catch(() => {});
  }, [
    open,
    stage.id,
    hintLevel,
    systemPromptPreview,
    sceneState,
    clueFound,
    searchUserMessages,
    briefingUserMessages,
  ]);

  const prompt = systemPromptPreview ?? fetchedPrompt;
  const stageInterruptions = getInterruptionsForStage(stage.id);

  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <div className="debug-panel">
      <button
        type="button"
        className="debug-panel-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        DEBUG {open ? '▾' : '▸'}
      </button>
      {open && (
        <div className="debug-panel-body">
          <p>
            <strong>Stage:</strong> {stage.id}
          </p>
          <p>
            <strong>Hints brugt:</strong> {hintLevel} / {getActiveHintCount(stage)}
          </p>
          <p>
            <strong>Beskeder:</strong> {messageCount}
          </p>
          {sceneState !== undefined && (
            <p>
              <strong>Scene:</strong> {sceneState}
              {hasArrived ? ' · ankommet' : ''}
              {clueFound ? ' · spor-QR' : ''}
              {searchUserMessages !== undefined
                ? ` · search ${searchUserMessages}/${stage.scene.minSearchExchanges}`
                : ''}
              {briefingUserMessages !== undefined
                ? ` · briefing ${briefingUserMessages}/${stage.scene.minBriefingExchanges}`
                : ''}
            </p>
          )}
          <p>
            <strong>Forbidden:</strong> {stage.forbiddenTopics.join(', ') || '—'}
          </p>

          {interruptionDebug && (
            <details open>
              <summary>Temporal interruptions</summary>
              <p>
                <strong>Aktiv:</strong> {interruptionDebug.activeId ?? '—'}
              </p>
              <p>
                <strong>Sidste trigger:</strong> {interruptionDebug.lastTrigger ?? '—'}
              </p>
              <p>
                <strong>Afspillet:</strong>{' '}
                {interruptionDebug.firedIds.length > 0
                  ? interruptionDebug.firedIds.join(', ')
                  : '—'}
              </p>
              {interruptionDebug.pendingTimers.length > 0 && (
                <ul className="debug-interruption-list">
                  {interruptionDebug.pendingTimers.map((t) => (
                    <li key={t.id}>
                      {t.id} ({t.trigger}) ~{Math.round(t.firesInMs / 1000)}s
                    </li>
                  ))}
                </ul>
              )}
              {interruptionDebug.history.length > 0 && (
                <ul className="debug-interruption-list">
                  {interruptionDebug.history.map((h) => (
                    <li key={`${h.id}-${h.at}`}>
                      {h.id} ← {h.source}
                    </li>
                  ))}
                </ul>
              )}
              {onForceInterruption && (
                <div className="debug-interruption-buttons">
                  {stageInterruptions.map((def) => (
                    <button
                      key={def.id}
                      type="button"
                      className="debug-interruption-btn"
                      onClick={() => onForceInterruption(def.id)}
                    >
                      {def.id}
                    </button>
                  ))}
                </div>
              )}
            </details>
          )}

          {visionDescription && (
            <p>
              <strong>Vision:</strong> {visionDescription}
            </p>
          )}
          <details>
            <summary>System prompt preview</summary>
            <pre className="debug-prompt">{prompt ?? 'Henter…'}</pre>
          </details>
          {rawVisionResponse && (
            <details>
              <summary>Raw vision response</summary>
              <pre className="debug-prompt">{rawVisionResponse}</pre>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
