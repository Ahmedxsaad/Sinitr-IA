import { describe, expect, it } from 'vitest';
import type { CoverageEvidence, DamageEvidence } from '@sinistria/contracts';
import { recommend, type RecommendInput } from './recommend.js';

const coverage: CoverageEvidence = {
  policyId: 'POL-DEMO-001',
  covered: true,
  matchedClauses: [
    { clauseId: 'COV-PD-1', title: 'Property damage', text: 'text', kind: 'coverage' },
  ],
  confidence: { label: 'high', score: 0.9 },
};

const lightDamage: DamageEvidence = {
  regions: [],
  severityRange: { min: 'cosmetic', max: 'cosmetic' },
};

const cleanInput: RecommendInput = {
  coverage,
  consistency: { checks: [], contradictions: 0, benignGaps: 0 },
  completeness: { score: 100, missing: [] },
  damage: lightDamage,
  anomalies: [],
};

describe('recommend', () => {
  it('fast-tracks a fully clean, fully complete, covered claim', () => {
    const result = recommend(cleanInput);
    expect(result.recommendation.route).toBe('fast_track');
    expect(result.recommendation.escalationReasons).toEqual([]);
    expect(result.overallConfidence.label).toBe('high');
  });

  it('routes to review when completeness falls short of the fast-track threshold', () => {
    const result = recommend({
      ...cleanInput,
      completeness: { score: 85, missing: ['A repair invoice'] },
    });
    expect(result.recommendation.route).toBe('review');
  });

  it('routes to review when coverage is not confirmed, even with perfect evidence', () => {
    const result = recommend({ ...cleanInput, coverage: { ...coverage, covered: false } });
    expect(result.recommendation.route).toBe('review');
    expect(result.recommendation.reasons[0]).toMatch(/could not be confirmed/i);
  });

  it('routes to investigate on a contradiction, overriding otherwise-perfect completeness', () => {
    const result = recommend({
      ...cleanInput,
      consistency: { checks: [], contradictions: 1, benignGaps: 0 },
    });
    expect(result.recommendation.route).toBe('investigate');
    expect(result.recommendation.escalationReasons).toContain('contradictory_evidence');
  });

  it('routes to investigate on a high-severity anomaly', () => {
    const result = recommend({
      ...cleanInput,
      anomalies: [{ type: 'reused_image', description: 'reused image', severity: 'high' }],
    });
    expect(result.recommendation.route).toBe('investigate');
  });

  it('routes to investigate on severe visible damage (potential hidden damage)', () => {
    const result = recommend({
      ...cleanInput,
      damage: { regions: [], severityRange: { min: 'moderate', max: 'severe' } },
    });
    expect(result.recommendation.route).toBe('investigate');
    expect(result.recommendation.escalationReasons).toContain('potential_hidden_damage');
    expect(result.recommendation.reasons.at(-1)).toMatch(/trust signals/i);
  });

  it('cites the matched policy clause id in the reasons', () => {
    const result = recommend(cleanInput);
    expect(result.recommendation.reasons.some((reason) => reason.includes('COV-PD-1'))).toBe(true);
  });

  it('never promises a payment in the draft customer message, for any route', () => {
    const routes: RecommendInput[] = [
      cleanInput,
      { ...cleanInput, completeness: { score: 50, missing: [] } },
      { ...cleanInput, consistency: { checks: [], contradictions: 1, benignGaps: 0 } },
    ];
    for (const input of routes) {
      const result = recommend(input);
      expect(result.recommendation.draftCustomerMessage.toLowerCase()).not.toMatch(
        /pay|reimburse|settlement amount/,
      );
    }
  });

  it('always includes at least one reason, regardless of route', () => {
    const result = recommend(cleanInput);
    expect(result.recommendation.reasons.length).toBeGreaterThan(0);
  });
});
