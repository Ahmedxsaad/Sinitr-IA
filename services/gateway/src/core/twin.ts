/**
 * Helpers for building and evolving an Accident Evidence Twin as it moves
 * through the pipeline. State changes go through the shared state machine so an
 * illegal jump throws rather than silently corrupting the record.
 */
import {
  type AccidentEvidenceTwin,
  type ClaimState,
  type Locale,
  assertTransition,
  makeConfidence,
} from '@sinistria/contracts';

/** Create the empty Twin for a brand-new claim, in the capturing state. */
export function createInitialTwin(
  claimId: string,
  correlationId: string,
  locale: Locale,
): AccidentEvidenceTwin {
  const now = new Date().toISOString();
  return {
    claimId,
    correlationId,
    state: 'capturing',
    locale,
    createdAt: now,
    updatedAt: now,
    structuredFacts: null,
    timeline: null,
    damage: null,
    coverage: null,
    consistency: null,
    completeness: null,
    anomalies: [],
    graphView: null,
    recommendation: null,
    overallConfidence: makeConfidence(0.3),
    audit: [{ at: now, actor: 'gateway', action: 'claim.created' }],
  };
}

/** Append an immutable audit line and bump the updated timestamp. */
export function appendAudit(
  twin: AccidentEvidenceTwin,
  actor: string,
  action: string,
  detail?: string,
): void {
  const at = new Date().toISOString();
  twin.audit.push({ at, actor, action, detail });
  twin.updatedAt = at;
}

/** Move the claim to a new state, validating the transition first. */
export function transition(twin: AccidentEvidenceTwin, to: ClaimState): void {
  assertTransition(twin.state, to);
  twin.state = to;
}
