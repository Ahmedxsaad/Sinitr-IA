import { describe, expect, it } from 'vitest';
import type { DamageEvidence } from '@sinistria/contracts';
import { groundCoverage } from './coverage.js';

const damageWithMax = (max: DamageEvidence['severityRange']['max']): DamageEvidence => ({
  regions: [],
  severityRange: { min: 'cosmetic', max },
});

describe('groundCoverage', () => {
  it('confirms coverage with only the property-damage clause for non-severe damage', () => {
    const coverage = groundCoverage(damageWithMax('cosmetic'));
    expect(coverage.covered).toBe(true);
    expect(coverage.matchedClauses).toHaveLength(1);
    expect(coverage.matchedClauses[0]?.kind).toBe('coverage');
    expect(coverage.confidence.label).toBe('high');
  });

  it('also surfaces the hidden-damage exclusion when damage reaches severe', () => {
    const coverage = groundCoverage(damageWithMax('severe'));
    expect(coverage.covered).toBe(true);
    expect(coverage.matchedClauses).toHaveLength(2);
    expect(coverage.matchedClauses.map((clause) => clause.kind)).toEqual(['coverage', 'exclusion']);
  });

  it('lowers confidence to medium when severe damage requires expert review', () => {
    const coverage = groundCoverage(damageWithMax('severe'));
    expect(coverage.confidence.label).toBe('medium');
  });

  it('does not add the exclusion clause for moderate (non-severe) damage', () => {
    const coverage = groundCoverage(damageWithMax('moderate'));
    expect(coverage.matchedClauses).toHaveLength(1);
  });

  it('always grounds coverage in the same policy id', () => {
    expect(groundCoverage(damageWithMax('cosmetic')).policyId).toBe(
      groundCoverage(damageWithMax('severe')).policyId,
    );
  });
});
