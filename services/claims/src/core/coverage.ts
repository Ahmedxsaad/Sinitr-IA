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
} from '@sinistria/contracts';

/**
 * A minimal seed policy with explicit clauses. A real deployment would retrieve
 * the customer's actual policy; the shape stays the same.
 */
const SEED_POLICY = {
  policyId: 'POL-DEMO-001',
  coverageClause: {
    clauseId: 'COV-PD-1',
    title: 'Property damage from collision',
    text: 'Visible collision damage to the insured vehicle is covered under the property-damage guarantee.',
    kind: 'coverage' as const,
  },
  hiddenDamageExclusion: {
    clauseId: 'EXC-HD-1',
    title: 'Hidden or structural damage',
    text: 'Severe or potentially structural damage requires expert inspection before settlement.',
    kind: 'exclusion' as const,
  },
};

/**
 * Ground coverage for a claim. Light visible collision damage is covered by the
 * property-damage clause. Severe damage additionally surfaces the hidden-damage
 * exclusion, which downstream logic treats as a reason to inspect.
 */
export function groundCoverage(damage: DamageEvidence): CoverageEvidence {
  const isSevere = damage.severityRange.max === 'severe';
  const matchedClauses: PolicyClause[] = [SEED_POLICY.coverageClause];
  if (isSevere) matchedClauses.push(SEED_POLICY.hiddenDamageExclusion);

  return {
    policyId: SEED_POLICY.policyId,
    covered: true, // property damage from collision is covered; severity affects the route, not coverage
    matchedClauses,
    confidence: makeConfidence(isSevere ? 0.6 : 0.9),
  };
}
