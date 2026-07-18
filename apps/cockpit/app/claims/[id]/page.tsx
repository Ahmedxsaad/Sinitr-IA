'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import type { AccidentEvidenceTwin, GraphView } from '@sinistria/contracts';

/**
 * A small two-column layout for the relationship graph: the claim under
 * review on the left, whatever it connects to on the right. The seeded graphs
 * are tiny (a handful of nodes), so a fixed layout reads clearly without
 * pulling in a general graph-layout library.
 */
const GRAPH_WIDTH = 480;

function layoutGraph(view: GraphView) {
  const focus = view.nodes.find((node) => node.isFocus);
  const others = view.nodes.filter((node) => !node.isFocus);
  const leftX = 150;
  const rightX = 390;
  const rowHeight = 100;
  const topY = 50;

  const positions = new Map<string, { x: number; y: number }>();
  if (focus) {
    positions.set(focus.id, { x: leftX, y: topY + ((others.length - 1) * rowHeight) / 2 });
  }
  others.forEach((node, index) => {
    positions.set(node.id, { x: rightX, y: topY + index * rowHeight });
  });

  const height = Math.max(topY * 2, topY + others.length * rowHeight + topY / 2);
  return { positions, height };
}

/**
 * Position an edge label along its line, not on top of either node. Sitting
 * at 40% of the way from source to target (rather than the exact midpoint)
 * leaves room for the target node's own label; nudging off the line and
 * alternating sides by index keeps two edges that pass close together (common
 * where several edges meet at the focus node) from printing on top of each
 * other.
 */
function labelOffset(
  from: { x: number; y: number },
  to: { x: number; y: number },
  index: number,
): { x: number; y: number } {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy) || 1;
  const side = index % 2 === 0 ? 1 : -1;
  const offset = 12 * side;
  const alongX = from.x + dx * 0.4;
  const alongY = from.y + dy * 0.4;
  return {
    x: alongX + (-dy / length) * offset,
    y: alongY + (dx / length) * offset,
  };
}

function GraphReveal({ view }: { view: GraphView }) {
  const [revealed, setRevealed] = useState(false);
  if (view.nodes.length === 0) return null;

  const { positions, height } = layoutGraph(view);

  return (
    <div className="card">
      <h3>Relationship graph</h3>
      {!revealed ? (
        <button type="button" className="secondary" onClick={() => setRevealed(true)}>
          Reveal relationship graph
        </button>
      ) : (
        <svg
          viewBox={`0 0 ${GRAPH_WIDTH} ${height}`}
          width={GRAPH_WIDTH}
          height={height}
          className="graph-svg"
          role="img"
          aria-label="Relationship graph for this claim"
        >
          {view.edges.map((edge, index) => {
            const from = positions.get(edge.source);
            const to = positions.get(edge.target);
            if (!from || !to) return null;
            const label = labelOffset(from, to, index);
            return (
              <g key={`${edge.source}-${edge.target}-${index}`}>
                <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} className="graph-edge" />
                <text x={label.x} y={label.y} className="graph-edge-label" textAnchor="middle">
                  {edge.relation}
                </text>
              </g>
            );
          })}
          {view.nodes.map((node) => {
            const pos = positions.get(node.id);
            if (!pos) return null;
            return (
              <g key={node.id}>
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={8}
                  className={`graph-node ${node.isFocus ? 'focus' : node.type}`}
                />
                {node.isFocus ? (
                  <text x={pos.x - 14} y={pos.y + 4} className="graph-node-label" textAnchor="end">
                    {node.label}
                  </text>
                ) : (
                  <text x={pos.x} y={pos.y - 14} className="graph-node-label" textAnchor="middle">
                    {node.label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
}

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

      {twin.graphView && <GraphReveal view={twin.graphView} />}

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
