/**
 * Turn the grounded coverage, evidence, and anomalies into a routed
 * recommendation with plain-language reasons. The machine prepares this. A human
 * still owns the decision, so nothing here approves a payment.
 */
import {
  type AnomalyFlag,
  type ClaimRoute,
  type Completeness,
  type ConsistencyEvidence,
  type CoverageEvidence,
  type DamageEvidence,
  type EscalationReason,
  type RecommendResult,
  makeConfidence,
} from '@sinistria/contracts';
import { THRESHOLDS } from '@sinistria/config';
import { computeConfidenceScore } from './score.js';
import { evaluateTrustGates } from './trust-gates.js';

export interface RecommendInput {
  coverage: CoverageEvidence;
  consistency: ConsistencyEvidence;
  completeness: Completeness;
  damage: DamageEvidence;
  anomalies: AnomalyFlag[];
}

/** Escalation reasons that require a full investigation rather than a review. */
const INVESTIGATE_REASONS: readonly EscalationReason[] = [
  'contradictory_evidence',
  'unusual_pattern',
  'potential_hidden_damage',
];

/** Choose the route from the escalation reasons and the fast-track thresholds. */
function chooseRoute(
  escalationReasons: EscalationReason[],
  input: RecommendInput,
  confidenceScore: number,
): ClaimRoute {
  if (escalationReasons.some((reason) => INVESTIGATE_REASONS.includes(reason))) {
    return 'investigate';
  }
  const cannotFastTrack =
    escalationReasons.includes('low_confidence') ||
    !input.coverage.covered ||
    input.completeness.score < THRESHOLDS.fastTrackMinCompleteness ||
    confidenceScore < THRESHOLDS.fastTrackMinConfidenceScore;
  return cannotFastTrack ? 'review' : 'fast_track';
}

/** Build the evidence-referencing reasons shown in the cockpit. */
function buildReasons(route: ClaimRoute, input: RecommendInput): string[] {
  const reasons: string[] = [];
  const clauseId = input.coverage.matchedClauses[0]?.clauseId ?? 'the property-damage clause';
  reasons.push(
    input.coverage.covered
      ? `Coverage confirmed via clause ${clauseId}.`
      : `Coverage could not be confirmed from clause ${clauseId}.`,
  );
  reasons.push(`Evidence completeness is ${input.completeness.score}%.`);
  reasons.push(
    input.consistency.contradictions === 0
      ? 'No contradictions between the story, the images, and the documents.'
      : `${input.consistency.contradictions} contradiction(s) detected between the story and the evidence.`,
  );
  if (input.anomalies.length > 0) {
    reasons.push(`${input.anomalies.length} relationship anomaly signal(s) present.`);
  }
  reasons.push(
    `Visible damage severity ranges from ${input.damage.severityRange.min} to ${input.damage.severityRange.max}.`,
  );

  if (route === 'fast_track') {
    reasons.push('Low visible severity and consistent evidence support a fast-track review.');
  } else if (route === 'review') {
    reasons.push(
      'One or more fast-track thresholds were not met, so a human review is recommended.',
    );
  } else {
    reasons.push('One or more trust signals require investigation before any decision.');
  }
  return reasons;
}

/** A neutral customer message per route. It never promises a payment. */
function draftCustomerMessage(route: ClaimRoute): string {
  switch (route) {
    case 'fast_track':
      return 'Your accident report has been received and prepared. Coverage is confirmed and your claim is on the fast-track review. An adjuster will confirm shortly.';
    case 'review':
      return 'Your accident report has been received. A claims adjuster will review the details and follow up with you.';
    case 'investigate':
      return 'Your accident report has been received and is being reviewed by our claims team. We may contact you for additional information.';
  }
}

/**
 * Produce the recommendation and the overall confidence for a prepared claim.
 */
export function recommend(input: RecommendInput): RecommendResult {
  const confidenceScore = computeConfidenceScore({
    contradictions: input.consistency.contradictions,
    highSeverityAnomalies: input.anomalies.filter((anomaly) => anomaly.severity === 'high').length,
    completeness: input.completeness.score,
    severeDamage: input.damage.severityRange.max === 'severe',
  });
  const confidence = makeConfidence(confidenceScore);

  const escalationReasons = evaluateTrustGates({
    consistency: input.consistency,
    anomalies: input.anomalies,
    damage: input.damage,
    completeness: input.completeness,
    confidenceScore,
  });

  const route = chooseRoute(escalationReasons, input, confidenceScore);

  return {
    coverage: input.coverage,
    overallConfidence: confidence,
    recommendation: {
      route,
      reasons: buildReasons(route, input),
      escalationReasons,
      confidence,
      draftCustomerMessage: draftCustomerMessage(route),
    },
  };
}
