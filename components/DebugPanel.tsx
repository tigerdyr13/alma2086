'use client';

import { useEffect, useState } from 'react';
import type { StageDefinition } from '@/lib/stages';

interface DebugPanelProps {
  stage: StageDefinition;
  hintLevel: number;
  messageCount: number;
  systemPromptPreview?: string | null;
}

export default function DebugPanel({
  stage,
  hintLevel,
  messageCount,
  systemPromptPreview,
}: DebugPanelProps) {
  const [open, setOpen] = useState(false);
  const [fetchedPrompt, setFetchedPrompt] = useState<string | null>(null);

  useEffect(() => {
    if (!open || systemPromptPreview) return;

    const url = `/api/debug/prompt?stage=${stage.id}&hintLevel=${hintLevel}`;
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (typeof data.systemPrompt === 'string') {
          setFetchedPrompt(data.systemPrompt);
        }
      })
      .catch(() => {});
  }, [open, stage.id, hintLevel, systemPromptPreview]);

  const prompt = systemPromptPreview ?? fetchedPrompt;

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
            <strong>Hints brugt:</strong> {hintLevel} / {stage.hints.length}
          </p>
          <p>
            <strong>Beskeder:</strong> {messageCount}
          </p>
          <p>
            <strong>Forbidden:</strong> {stage.forbiddenTopics.join(', ') || '—'}
          </p>
          <details>
            <summary>System prompt preview</summary>
            <pre className="debug-prompt">{prompt ?? 'Henter…'}</pre>
          </details>
        </div>
      )}
    </div>
  );
}
