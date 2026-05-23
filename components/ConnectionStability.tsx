'use client';

import { useEffect, useState } from 'react';

interface ConnectionStabilityProps {
  /** Basisværdi fra stage config (fx 62) */
  base: number;
}

/**
 * Viser forbindelsesstyrke der pulserer lidt omkring base –
 * som et ustabilt sci-fi signal.
 */
export default function ConnectionStability({ base }: ConnectionStabilityProps) {
  const [display, setDisplay] = useState(base);

  useEffect(() => {
    setDisplay(base);
    let frame = 0;
    let lastTick = 0;

    const tick = (now: number) => {
      if (now - lastTick >= 280) {
        lastTick = now;
        const t = now / 1000;
        // Langsom, lille udsving omkring base
        const pulse =
          Math.sin(t * 0.45) * 1.5 +
          Math.sin(t * 0.75 + 0.5) * 1 +
          Math.sin(t * 0.18) * 0.5;
        const next = Math.round(Math.min(100, Math.max(0, base + pulse)));
        setDisplay(next);
      }
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [base]);

  return (
    <>
      <div className="stage-hud-row">
        <span className="stage-hud-label">CONNECTION STABLE</span>
        <span className="stage-hud-value stage-hud-value--stability stage-hud-value--pulse">
          {display}%
        </span>
      </div>
      <div className="stage-stability-bar" aria-hidden="true">
        <div
          className="stage-stability-fill stage-stability-fill--pulse"
          style={{ width: `${display}%` }}
        />
      </div>
    </>
  );
}
