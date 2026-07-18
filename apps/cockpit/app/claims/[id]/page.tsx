'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import type { AccidentEvidenceTwin } from '@sinistria/contracts';

export default function ClaimDetailPage() {
  const params = useParams<{ id: string }>();
  const claimId = params.id;

  const [twin, setTwin] = useState<AccidentEvidenceTwin | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  const load = useCallback(async () => {
    const response = await fetch(`/api/claims/${claimId}`);
    if (!response.ok) throw new Error(`Failed to load claim (status ${response.status}).`);
    setTwin((await response.json()) as AccidentEvidenceTwin);
  }, [claimId]);

  useEffect(() => {
    load().catch((caught: unknown) =>
      setError(caught instanceof Error ? caught.message : 'Unexpected error.'),
    );
  }, [load]);

  async function approve() {
    setWorking(true);
    setError(null);
    try {
      const response = await fetch(`/api/claims/${claimId}/decision`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      });
      if (!response.ok) throw new Error(`Could not approve (status ${response.status}).`);
      setTwin((await response.json()) as AccidentEvidenceTwin);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unexpected error.');
    } finally {
      setWorking(false);
    }
  }

  if (error)
    return (
      <main className="page">
        <p className="chip">{error}</p>
      </main>
    );
  if (!twin)
    return (
      <main className="page">
        <p className="muted">Loading...</p>
      </main>
    );

  const { recommendation, coverage, completeness, consistency, damage, timeline, structuredFacts } =
    twin;

  return (
    <main className="page">
      <p>
        <a href="/">Back to queue</a>
      </p>
      <h1>
        {twin.claimId}{' '}
        {recommendation && (
          <span className={`route ${recommendation.route}`}>
            {recommendation.route.replace('_', ' ')}
          </span>
        )}
      </h1>
      <p className="muted">
        State: {twin.state} | Overall confidence: {twin.overallConfidence.label}
      </p>

      <div className="card hierarchy">
        {/* Top: the decision the machine prepared, owned by the human. */}
        <div className="tier">
          <h3>Decision</h3>
          {recommendation ? (
            <>
              <p>
                Recommended route: <strong>{recommendation.route.replace('_', ' ')}</strong>{' '}
                (confidence {recommendation.confidence.label})
              </p>
              <ul>
                {recommendation.reasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
              {recommendation.escalationReasons.length > 0 && (
                <p>
                  {recommendation.escalationReasons.map((reason) => (
                    <span key={reason} className="chip">
                      {reason.replace(/_/g, ' ')}
                    </span>
                  ))}
                </p>
              )}
            </>
          ) : (
            <p className="muted">No recommendation prepared.</p>
          )}
        </div>

        {/* Middle: why, grounded in policy, completeness, and consistency. */}
        <div className="tier">
          <h3>Why</h3>
          {coverage && (
            <p>
              Coverage {coverage.covered ? 'confirmed' : 'not confirmed'} via{' '}
              {coverage.matchedClauses
                .map((clause) => `${clause.clauseId} (${clause.title})`)
                .join(', ')}
              .
            </p>
          )}
          {completeness && <p>Evidence completeness: {completeness.score}%.</p>}
          {consistency && (
            <ul>
              {consistency.checks.map((check) => (
                <li key={check.id}>
                  <strong>{check.status}</strong>: {check.detail}
                </li>
              ))}
            </ul>
          )}
          {twin.anomalies.length > 0 && (
            <ul>
              {twin.anomalies.map((anomaly) => (
                <li key={anomaly.type}>
                  {anomaly.description}
                  {anomaly.relatedClaimId ? ` (see ${anomaly.relatedClaimId})` : ''}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Bottom: the raw proof each output is grounded in. */}
        <div className="tier">
          <h3>Proof</h3>
          {structuredFacts && (
            <p className="muted">Voice: &ldquo;{structuredFacts.claimantStatement.value}&rdquo;</p>
          )}
          {timeline && (
            <p>
              Reported collision direction: {timeline.collisionDirection.value.replace('_', ' ')}.
            </p>
          )}
          {damage && (
            <p>
              Visible damage:{' '}
              {damage.regions.length > 0
                ? damage.regions
                    .map((region) => `${region.area.replace('_', ' ')} (${region.severity})`)
                    .join(', ')
                : 'none analyzed'}
              . Severity range {damage.severityRange.min} to {damage.severityRange.max}.
            </p>
          )}
        </div>
      </div>

      <div className="card">
        <h3>Audit trail</h3>
        <ul>
          {twin.audit.map((entry, index) => (
            <li key={`${entry.action}-${index}`}>
              <span className="muted">{entry.at}</span> - {entry.actor}: {entry.action}
              {entry.detail ? ` (${entry.detail})` : ''}
            </li>
          ))}
        </ul>
      </div>

      {twin.state === 'recommended' ? (
        <button type="button" onClick={approve} disabled={working}>
          {working ? 'Approving...' : 'Approve and notify customer'}
        </button>
      ) : (
        <p className="muted">This claim is not awaiting a decision.</p>
      )}
    </main>
  );
}
