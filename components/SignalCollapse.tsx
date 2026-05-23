'use client';

import { useEffect, useState } from 'react';
import { playInterruptionGlitch } from '@/lib/interruption-audio';

interface SignalCollapseProps {
  onComplete: () => void;
  isFinale?: boolean;
}

type Phase = 'destabilizing' | 'lost';

export default function SignalCollapse({ onComplete, isFinale = false }: SignalCollapseProps) {
  const [phase, setPhase] = useState<Phase>('destabilizing');

  useEffect(() => {
    void playInterruptionGlitch('strong');
    const t1 = window.setTimeout(() => {
      setPhase('lost');
      void playInterruptionGlitch('normal');
    }, 1800);
    const t2 = window.setTimeout(onComplete, isFinale ? 3200 : 2800);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [onComplete, isFinale]);

  return (
    <div className="signal-collapse">
      <div className="signal-collapse-noise" aria-hidden="true" />
      <div className="signal-collapse-inner">
        {phase === 'destabilizing' ? (
          <>
            <p className="signal-collapse-label signal-collapse-flicker">SIGNAL DESTABILIZING</p>
            <p className="signal-collapse-sub">TEMPORAL LINK FAILING</p>
          </>
        ) : (
          <>
            <p className="signal-collapse-label signal-collapse-flicker signal-collapse-label--lost">
              {isFinale ? 'SIGNAL FADING' : 'SIGNAL LOST'}
            </p>
            {!isFinale && <p className="signal-collapse-sub">CONNECTION TERMINATED</p>}
          </>
        )}
      </div>
    </div>
  );
}
