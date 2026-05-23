'use client';

interface AudioUnlockGateProps {
  onUnlock: () => void;
}

export default function AudioUnlockGate({ onUnlock }: AudioUnlockGateProps) {
  return (
    <div className="audio-unlock-gate" role="dialog" aria-label="Start lyd">
      <div className="audio-unlock-gate-inner">
        <p className="audio-unlock-gate-label">TEMPORAL LINK READY</p>
        <h2 className="audio-unlock-gate-title">Tryk for at høre Alma</h2>
        <p className="audio-unlock-gate-sub">
          Telefonen skal have tilladelse til lyd før forbindelsen starter.
        </p>
        <button type="button" className="audio-unlock-gate-btn" onClick={onUnlock}>
          ▶ START FORBINDELSE
        </button>
      </div>
    </div>
  );
}
