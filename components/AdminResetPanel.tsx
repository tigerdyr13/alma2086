'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import {
  clearAllStageSessions,
  clearStageSession,
  getAllStageSessionSummaries,
  type StageSessionSummary,
} from '@/lib/session';
import { clearAllInterruptionFlags, clearInterruptionFlagsForStage } from '@/lib/interruption-storage';
import type { StageId } from '@/lib/stages';

function formatTime(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat('da-DK', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return '—';
  }
}

export default function AdminResetPanel() {
  const [summaries, setSummaries] = useState<StageSessionSummary[]>([]);
  const [confirmAll, setConfirmAll] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setSummaries(getAllStageSessionSummaries());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleResetStage = (stageId: StageId) => {
    clearStageSession(stageId);
    clearInterruptionFlagsForStage(stageId);
    refresh();
    setStatus(`${stageId} er nulstillet på denne telefon.`);
    setConfirmAll(false);
  };

  const handleResetAll = () => {
    if (!confirmAll) {
      setConfirmAll(true);
      setStatus(null);
      return;
    }

    clearAllStageSessions();
    clearAllInterruptionFlags();
    refresh();
    setConfirmAll(false);
    setStatus('Hele spillet er nulstillet på denne telefon.');
  };

  const hasAnyData = summaries.some((s) => s.hasData);

  return (
    <div className="admin-reset">
      <div className="admin-reset-inner">
        <p className="admin-reset-label">KONTROL · 2086</p>
        <h1 className="admin-reset-title">Tidskanal-administration</h1>
        <p className="admin-reset-text">
          Nulstil gemt progress på <strong>denne telefon</strong>. Chat og hints per post slettes
          fra browseren.
        </p>

        <div className="admin-reset-table-wrap">
          <table className="admin-reset-table">
            <thead>
              <tr>
                <th>Post</th>
                <th>Beskeder</th>
                <th>Hints</th>
                <th>Sidst</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {summaries.map((row) => (
                <tr key={row.stageId} className={row.hasData ? 'admin-reset-row--active' : undefined}>
                  <td>{row.stageId}</td>
                  <td>{row.messageCount}</td>
                  <td>{row.hintLevel}</td>
                  <td>{formatTime(row.updatedAt)}</td>
                  <td>
                    <button
                      type="button"
                      className="admin-reset-stage-btn"
                      disabled={!row.hasData}
                      onClick={() => handleResetStage(row.stageId)}
                    >
                      Nulstil
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!hasAnyData && (
          <p className="admin-reset-empty">Ingen gemt progress på denne enhed.</p>
        )}

        {status && <p className="admin-reset-status">{status}</p>}

        <div className="admin-reset-actions">
          <button
            type="button"
            className={`admin-reset-all-btn${confirmAll ? ' admin-reset-all-btn--confirm' : ''}`}
            onClick={handleResetAll}
            disabled={!hasAnyData && !confirmAll}
          >
            {confirmAll ? 'Bekræft: nulstil alt' : 'Nulstil hele spillet'}
          </button>
          {confirmAll && (
            <button
              type="button"
              className="admin-reset-cancel-btn"
              onClick={() => setConfirmAll(false)}
            >
              Annuller
            </button>
          )}
        </div>

        <Link href="/s/intro" className="admin-reset-link">
          Tilbage til intro
        </Link>
      </div>
    </div>
  );
}
