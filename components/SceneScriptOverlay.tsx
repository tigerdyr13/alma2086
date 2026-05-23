'use client';

interface SceneScriptOverlayProps {
  line: string | null;
}

export default function SceneScriptOverlay({ line }: SceneScriptOverlayProps) {
  if (!line) return null;

  return (
    <div className="scene-script-overlay" role="status" aria-live="polite">
      <div className="scene-script-overlay-inner">
        <p className="scene-script-overlay-label">ALMA · 2086</p>
        <p className="scene-script-overlay-line">{line}</p>
      </div>
    </div>
  );
}
