/**
 * The trust gates: the deterministic rules that decide when a prepared claim
 * must leave the fast lane. This is the credibility centerpiece a risk reviewer
 * will probe, so it stays explicit, readable, and free of any model call.
 */
import type {
  AnomalyFlag,
  Completeness,
  ConsistencyEvidence,
  DamageEvidence,
  EscalationReason,
} from '@sinistria/contracts';
import { THRESHOLDS } from '@sinistria/config';

export interface TrustGateInput {
  consistency: ConsistencyEvidence;
  anomalies: AnomalyFlag[];
  damage: DamageEvidence;
  completeness: Completeness;
  confidenceScore: number;
}

/**
 * Evaluate every escalation trigger and return the reasons that fired. An empty
 * result means no gate objects to the claim continuing on the automated path.
 */
export function evaluateTrustGates(input: TrustGateInput): EscalationReason[] {
  const reasons: EscalationReason[] = [];

  if (input.consistency.contradictions > 0) {
    reasons.push('contradictory_evidence');
  }
  if (input.anomalies.some((anomaly) => anomaly.severity === 'high')) {
    reasons.push('unusual_pattern');
  }
  if (input.damage.severityRange.max === 'severe') {
    reasons.push('potential_hidden_damage');
  }
  if (input.confidenceScore < THRESHOLDS.lowConfidenceScore) {
    reasons.push('low_confidence');
  }

  return reasons;
}
