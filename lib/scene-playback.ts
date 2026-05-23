import type { ScriptLine } from './scene-state';

export interface SceneLineSegment {
  displayText: string;
  audioSrc: string | null;
}

export async function fetchSceneLineAudio(lines: ScriptLine[]): Promise<SceneLineSegment[]> {
  try {
    const res = await fetch('/api/interruption', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lines: lines.map((l) => ({
          displayText: l.displayText,
          speechText: l.speechText,
        })),
      }),
    });
    const data = await res.json();
    if (!res.ok || !Array.isArray(data.segments)) {
      return lines.map((l) => ({ displayText: l.displayText, audioSrc: null }));
    }
    return data.segments.map(
      (s: { displayText: string; audioBase64: string; mimeType: string }) => ({
        displayText: s.displayText,
        audioSrc: `data:${s.mimeType};base64,${s.audioBase64}`,
      }),
    );
  } catch {
    return lines.map((l) => ({ displayText: l.displayText, audioSrc: null }));
  }
}

export async function playSceneLines(
  lines: ScriptLine[],
  segments: SceneLineSegment[],
  audio: HTMLAudioElement,
  onLine?: (displayText: string, index: number) => void,
): Promise<void> {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const segment = segments[i];
    onLine?.(line.displayText, i);

    if (segment?.audioSrc) {
      await new Promise<void>((resolve) => {
        audio.pause();
        audio.currentTime = 0;
        audio.src = segment.audioSrc!;
        audio.onended = () => resolve();
        audio.onerror = () => resolve();
        audio.play().catch(() => {
          // Afspilning blokeret – vent kort og prøv én gang mere
          window.setTimeout(() => {
            audio.play().catch(() => resolve());
          }, 120);
        });
      });
    } else {
      await new Promise((r) => setTimeout(r, 2200));
    }

    const pause = line.pauseAfterMs ?? 500;
    await new Promise((r) => setTimeout(r, pause));
  }
}

function wait(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export { wait };
