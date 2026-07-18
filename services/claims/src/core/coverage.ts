/**
 * Policy-grounded coverage. Every recommendation must be able to point at the
 * insurer's own policy language, so coverage is expressed as matched clauses,
 * not as an opaque yes or no.
 */
import {
  type CoverageEvidence,
  type DamageEvidence,
  type PolicyClause,
  makeConfidence,
  policyFixtureSchema,
} from '@sinistria/contracts';
import policyFixture from '../../../../data/policies/motor-standard.json';

/**
 * The seed policy, loaded from the canonical fixture in `data/policies` and
 * validated at load so a malformed edit fails fast. A real deployment would
 * retrieve the customer's actual policy; the shape stays the same.
 */
const seedPolicy = policyFixtureSchema.parse(policyFixture);

/** The first clause of a kind, or an explicit failure: grounding cannot run without it. */
function requireClause(kind: PolicyClause['kind']): PolicyClause {
  const clause = seedPolicy.clauses.find((candidate) => candidate.kind === kind);
  if (!clause) {
    throw new Error(`Policy fixture ${seedPolicy.policyId} has no ${kind} clause.`);
  }
  return clause;
}

const coverageClause = requireClause('coverage');
const hiddenDamageExclusion = requireClause('exclusion');

/**
 * Ground coverage for a claim. Light visible collision damage is covered by the
 * property-damage clause. Severe damage additionally surfaces the hidden-damage
 * exclusion, which downstream logic treats as a reason to inspect.
 */
export function groundCoverage(damage: DamageEvidence): CoverageEvidence {
  const isSevere = damage.severityRange.max === 'severe';
  const matchedClauses: PolicyClause[] = [coverageClause];
  if (isSevere) matchedClauses.push(hiddenDamageExclusion);

  return {
    policyId: seedPolicy.policyId,
    covered: true, // property damage from collision is covered; severity affects the route, not coverage
    matchedClauses,
    confidence: makeConfidence(isSevere ? 0.6 : 0.9),
  };
}
