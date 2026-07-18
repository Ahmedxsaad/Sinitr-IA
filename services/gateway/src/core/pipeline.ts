/**
 * The honest-claim orchestration. This is the "Protect, Capture, Reconstruct,
 * Verify, Recommend" loop expressed as one function. It depends only on the
 * ServiceClients interface, so it runs identically over HTTP in production and
 * in-process in the integration test.
 */
import {
  type AccidentEvidenceTwin,
  type CreateClaimRequest,
  type EscalationReason,
  makeConfidence,
} from '@sinistria/contracts';
import type { ServiceClients } from './clients.js';
import { appendAudit, createInitialTwin, transition } from './twin.js';

export interface ClaimIds {
  claimId: string;
  correlationId: string;
}

/**
 * Build the escalation branch of the Twin when a safety or eligibility gate
 * bypasses automation. The claim goes straight to a human with a neutral
 * message; nothing about money is decided.
 */
function escalate(
  twin: AccidentEvidenceTwin,
  gateReasons: string[],
  escalations: EscalationReason[],
): void {
  transition(twin, 'escalated');
  twin.overallConfidence = makeConfidence(0.9);
  twin.recommendation = {
    route: 'review',
    reasons: gateReasons.length > 0 ? gateReasons : ['Escalated by a safety or eligibility gate.'],
    escalationReasons: escalations,
    confidence: makeConfidence(0.9),
    draftCustomerMessage:
      'Your report has been received. Because it may involve injury or a complex situation, a specialist will handle your claim directly.',
  };
  appendAudit(twin, 'gateway', 'claim.escalated', gateReasons.join(' '));
}

/**
 * Run a create-claim request through the full pipeline and return the assembled
 * Twin. The returned Twin is either `recommended` (ready for the adjuster) or
 * `escalated` (routed straight to a human).
 */
export async function runClaimPipeline(
  request: CreateClaimRequest,
  ids: ClaimIds,
  clients: ServiceClients,
): Promise<AccidentEvidenceTwin> {
  const twin = createInitialTwin(ids.claimId, ids.correlationId, request.locale);
  const trace = { claimId: ids.claimId, correlationId: ids.correlationId };

  // 1. Capture: transcribe and structure, then run the safety and eligibility gates.
  const intake = await clients.intake({
    ...trace,
    locale: request.locale,
    narrative: request.narrative,
    injuryReported: request.injuryReported,
    collisionDirection: request.collisionDirection,
    confirmed: request.confirmed,
    mediaRefs: request.mediaRefs,
  });
  twin.structuredFacts = intake.fnol.structuredFacts;
  twin.timeline = intake.fnol.timeline;
  appendAudit(twin, 'intake', 'intake.structured');

  if (!intake.gates.safetyPassed || !intake.gates.eligibilityPassed) {
    const escalations: EscalationReason[] = [];
    if (!intake.gates.safetyPassed) escalations.push('injury_or_safety');
    if (intake.gates.safetyPassed && !intake.gates.eligibilityPassed)
      escalations.push('unusual_pattern');
    escalate(twin, intake.gates.reasons, escalations);
    return twin;
  }
  transition(twin, 'reconstructing');

  // 2. Reconstruct: damage, consistency, and completeness become the Twin.
  const evidence = await clients.evidence({
    ...trace,
    fnol: intake.fnol,
    mediaRefs: request.mediaRefs,
  });
  twin.damage = evidence.damage;
  twin.consistency = evidence.consistency;
  twin.completeness = evidence.completeness;
  appendAudit(twin, 'evidence', 'evidence.built', `completeness ${evidence.completeness.score}%`);
  transition(twin, 'verifying');

  // 3. Verify: relationship and anomaly signals.
  const graph = await clients.graph({
    ...trace,
    claimantPhone: request.contact.phone,
    garagePhone: request.garagePhone,
    mediaRefs: request.mediaRefs,
  });
  twin.anomalies = graph.anomalies;
  appendAudit(twin, 'graph', 'graph.checked', `${graph.anomalies.length} anomaly signal(s)`);

  // 4. Recommend: ground coverage, apply trust gates, choose a route.
  const recommendation = await clients.claims({
    ...trace,
    fnol: intake.fnol,
    evidence,
    anomalies: graph.anomalies,
    gates: intake.gates,
  });
  twin.coverage = recommendation.coverage;
  twin.recommendation = recommendation.recommendation;
  twin.overallConfidence = recommendation.overallConfidence;
  appendAudit(twin, 'claims', 'claims.recommended', `route=${recommendation.recommendation.route}`);
  transition(twin, 'recommended');

  return twin;
}
