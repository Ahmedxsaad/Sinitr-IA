'use client';

import { useEffect, useState } from 'react';
import type { ClaimRoute, ClaimState, Confidence, MetricsResult } from '@sinistria/contracts';

/** The compact summary shape the gateway returns for the queue. */
interface ClaimSummary {
  claimId: string;
  state: ClaimState;
  route: ClaimRoute | null;
  overallConfidence: Confidence;
  createdAt: string;
}

/** "1,284" for a whole number, "-" when there is not enough data yet. */
function formatCount(value: number | null): string {
  return value === null ? '-' : value.toLocaleString();
}

/** "4.2s" for a millisecond duration, "-" when there is not enough data yet. */
function formatSeconds(valueMs: number | null): string {
  return valueMs === null ? '-' : `${(valueMs / 1000).toFixed(1)}s`;
}

/** "92%" for a 0-100 score, "-" when there is not enough data yet. */
function formatPercent(value: number | null): string {
  return value === null ? '-' : `${Math.round(value)}%`;
}

function MetricsStrip({ metrics }: { metrics: MetricsResult }) {
  return (
    <>
      <section className="metrics">
        <div className="stat-tile">
          <p className="stat-label">Claims processed</p>
          <p className="stat-value">{formatCount(metrics.totalClaims)}</p>
        </div>
        <div className="stat-tile">
          <p className="stat-label">Avg time to FNOL</p>
          <p className="stat-value">{formatSeconds(metrics.averageTimeToFnolMs)}</p>
        </div>
        <div className="stat-tile">
          <p className="stat-label">Avg evidence completeness</p>
          <p className="stat-value">{formatPercent(metrics.averageEvidenceCompleteness)}</p>
        </div>
        <div className="stat-tile">
          <p className="stat-label">Routes</p>
          <p className="stat-value route-breakdown">
            <span className="route fast_track">{metrics.routeCounts.fast_track} fast-track</span>
            <span className="route review">{metrics.routeCounts.review} review</span>
            <span className="route investigate">{metrics.routeCounts.investigate} investigate</span>
          </p>
        </div>
      </section>
      <p className="muted small">Live counts, measured on this demo session.</p>
    </>
  );
}

export default function QueuePage() {
  const [claims, setClaims] = useState<ClaimSummary[]>([]);
  const [metrics, setMetrics] = useState<MetricsResult | null>(null);
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

    // Metrics are shown best-effort: a failure here should not block the
    // queue table, which is the page's primary job.
    fetch('/api/metrics')
      .then((response) => {
        if (!response.ok) throw new Error(`Failed to load metrics (status ${response.status}).`);
        return response.json() as Promise<MetricsResult>;
      })
      .then(setMetrics)
      .catch(() => setMetrics(null));
  }, []);

  return (
    <main className="page">
      <h1>Claims queue</h1>
      <p className="muted">
        Claims arrive from the mobile journey. Open one to review its Evidence Twin.
      </p>

      {metrics && <MetricsStrip metrics={metrics} />}

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
