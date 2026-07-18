'use client';

import { useEffect, useState } from 'react';
import type { ClaimRoute, ClaimState, Confidence } from '@sinistria/contracts';

/** The compact summary shape the gateway returns for the queue. */
interface ClaimSummary {
  claimId: string;
  state: ClaimState;
  route: ClaimRoute | null;
  overallConfidence: Confidence;
  createdAt: string;
}

export default function QueuePage() {
  const [claims, setClaims] = useState<ClaimSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/claims')
      .then((response) => {
        if (!response.ok) throw new Error(`Failed to load claims (status ${response.status}).`);
        return response.json() as Promise<ClaimSummary[]>;
      })
      .then(setClaims)
      .catch((caught: unknown) =>
        setError(caught instanceof Error ? caught.message : 'Unexpected error.'),
      );
  }, []);

  return (
    <main className="page">
      <h1>Claims queue</h1>
      <p className="muted">
        Claims arrive from the mobile journey. Open one to review its Evidence Twin.
      </p>

      {error && <p className="chip">{error}</p>}

      <div className="card">
        {claims.length === 0 ? (
          <p className="muted">No claims yet. Submit one from the mobile app.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Claim</th>
                <th>State</th>
                <th>Route</th>
                <th>Confidence</th>
              </tr>
            </thead>
            <tbody>
              {claims.map((claim) => (
                <tr key={claim.claimId}>
                  <td>
                    <a href={`/claims/${claim.claimId}`}>{claim.claimId}</a>
                  </td>
                  <td>{claim.state}</td>
                  <td>
                    {claim.route ? (
                      <span className={`route ${claim.route}`}>
                        {claim.route.replace('_', ' ')}
                      </span>
                    ) : (
                      <span className="muted">-</span>
                    )}
                  </td>
                  <td>{claim.overallConfidence.label}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
