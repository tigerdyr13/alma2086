'use client';

interface ConnectionLostProps {
  nextStageHint: string;
  betweenStagesGuidance: string;
  nextStageLabel: string | null;
  isFinale?: boolean;
  onScanClick: () => void;
}

export default function ConnectionLost({
  nextStageHint,
  betweenStagesGuidance,
  nextStageLabel,
  isFinale = false,
  onScanClick,
}: ConnectionLostProps) {
  return (
    <div className="connection-lost">
      <div className="connection-lost-inner">
        <p className="connection-lost-label">
          {isFinale ? 'FORBINDELSEN LUKKET' : 'SIGNAL LOST'}
        </p>
        <h2 className="connection-lost-title">
          {isFinale ? 'Tak for rejsen' : 'Forbindelsen er lukket'}
        </h2>

        {!isFinale && (
          <p className="connection-lost-reconnect">
            Alma er der stadig – men signalet dør mellem hvert spor. I hvert nye rum:
            scan <strong>indgangs-QR</strong> ved døren, led med Alma, og scan derefter{' '}
            <strong>spor-QR</strong> inde i rummet når I har fundet sporet.
          </p>
        )}

        {!isFinale && nextStageLabel && (
          <p className="connection-lost-next">
            Næste signal: <span>{nextStageLabel}</span>
          </p>
        )}

        {!isFinale && betweenStagesGuidance && (
          <p className="connection-lost-guidance">{betweenStagesGuidance}</p>
        )}

        {!isFinale && nextStageHint && (
          <p className="connection-lost-hint">{nextStageHint}</p>
        )}

        {isFinale ? (
          <p className="connection-lost-finale">Alma er væk. Kufferten er åben. 🎁</p>
        ) : (
          <button type="button" className="connection-lost-scan" onClick={onScanClick}>
            📡 SCAN QR – GENOPRET FORBINDELSEN
          </button>
        )}
      </div>
    </div>
  );
}
