'use client';

import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import type { ClaimRoute, ClaimState, Confidence, MetricsResult } from '@sinistria/contracts';
import { BrandMark, ConfidenceBadge, RouteBadge } from '@sinistria/ui';

/** Sets the --rise-delay custom property the .rise animation reads, so a
 * sequence of cards can stagger in one after another. */
function riseDelay(seconds: number): CSSProperties {
  return { '--rise-delay': `${seconds}s` } as CSSProperties;
}

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
  return value === null ? '-' : Math.round(value).toLocaleString();
}

/** "4.2s" for a millisecond duration, "-" when there is not enough data yet. */
function formatSeconds(valueMs: number | null): string {
  return valueMs === null ? '-' : `${(valueMs / 1000).toFixed(1)}s`;
}

/** "92%" for a 0-100 score, "-" when there is not enough data yet. */
function formatPercent(value: number | null): string {
  return value === null ? '-' : `${Math.round(value)}%`;
}

/**
 * Eases a stat tile's value up from zero on first paint, purely a visual
 * flourish so the metrics strip feels alive rather than static text. Once a
 * target arrives it is never re-animated on subsequent polls of the same
 * value (the effect keys off the target itself).
 */
function useCountUp(target: number | null, durationMs = 800): number | null {
  const [value, setValue] = useState<number | null>(target === null ? null : 0);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    if (target === null) {
      setValue(null);
      return;
    }
    const start = performance.now();
    const targetValue = target;
    function tick(now: number) {
      const progress = Math.min(1, (now - start) / durationMs);
      const eased = 1 - (1 - progress) ** 3;
      setValue(targetValue * eased);
      if (progress < 1) frame.current = requestAnimationFrame(tick);
    }
    frame.current = requestAnimationFrame(tick);
    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
    // Deliberately keyed only on target: re-running on every render (or
    // whenever durationMs changes, which it never does in practice) would
    // restart the animation on every re-poll of the same value.
  }, [target]);

  return value;
}

function MetricsStrip({ metrics }: { metrics: MetricsResult }) {
  const totalClaims = useCountUp(metrics.totalClaims);
  const avgTimeToFnol = useCountUp(metrics.averageTimeToFnolMs);
  const avgCompleteness = useCountUp(metrics.averageEvidenceCompleteness);

  return (
    <>
      <section className="metrics">
        <div className="stat-tile rise">
          <p className="stat-label">Claims processed</p>
          <p className="stat-value">{formatCount(totalClaims)}</p>
        </div>
        <div className="stat-tile rise" style={riseDelay(0.06)}>
          <p className="stat-label">Avg time to FNOL</p>
          <p className="stat-value">{formatSeconds(avgTimeToFnol)}</p>
        </div>
        <div className="stat-tile rise" style={riseDelay(0.12)}>
          <p className="stat-label">Avg evidence completeness</p>
          <p className="stat-value">{formatPercent(avgCompleteness)}</p>
        </div>
        <div className="stat-tile rise" style={riseDelay(0.18)}>
          <p className="stat-label">Routes</p>
          <p className="stat-value route-breakdown">
            <span>
              {metrics.routeCounts.fast_track} <RouteBadge route="fast_track" />
            </span>
            <span>
              {metrics.routeCounts.review} <RouteBadge route="review" />
            </span>
            <span>
              {metrics.routeCounts.investigate} <RouteBadge route="investigate" />
            </span>
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
      <div className="topbar rise">
        <span className="brand">
          <span className="brand-mark">
            <BrandMark size={22} />
          </span>
          <span>
            <span className="brand-name">Sinistr&apos;IA Cockpit</span>
            <br />
            <span className="brand-tag">Adjuster review</span>
          </span>
        </span>
        <span className="live-pill">
          <span className="live-dot" aria-hidden="true" />
          Live
        </span>
      </div>

      <h1 className="rise" style={riseDelay(0.04)}>
        Claims queue
      </h1>
      <p className="muted rise" style={riseDelay(0.06)}>
        Claims arrive from the mobile journey. Open one to review its Evidence Twin.{' '}
        <a href="/signals">View situational signals</a>.
      </p>

      {metrics && <MetricsStrip metrics={metrics} />}

      {error && <p className="chip">{error}</p>}

      <div className="card rise" style={riseDelay(0.24)}>
        {claims.length === 0 ? (
          <p className="muted empty-state">No claims yet. Submit one from the mobile app.</p>
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
                      <RouteBadge route={claim.route} />
                    ) : (
                      <span className="muted">-</span>
                    )}
                  </td>
                  <td>
                    <ConfidenceBadge confidence={claim.overallConfidence.label} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
