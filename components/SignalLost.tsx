import Link from 'next/link';

interface SignalLostProps {
  attemptedStage?: string;
}

export default function SignalLost({ attemptedStage }: SignalLostProps) {
  return (
    <div className="signal-lost">
      <div className="signal-lost-inner">
        <div className="signal-lost-icon" aria-hidden="true">
          SIGNAL LOST
        </div>
        <h1 className="signal-lost-title">FORBINDELSE AFBRYDT</h1>
        <p className="signal-lost-text">
          Tidskanalen <span className="signal-lost-code">{attemptedStage ?? '???'}</span> findes
          ikke i Alma2086-netværket.
        </p>
        <p className="signal-lost-sub">
          Signalet er dødt. Scan en gyldig QR-kode for at genoprette forbindelsen.
        </p>
        <Link href="/s/intro" className="signal-lost-link">
          Prøv intro-kanalen
        </Link>
      </div>
    </div>
  );
}
