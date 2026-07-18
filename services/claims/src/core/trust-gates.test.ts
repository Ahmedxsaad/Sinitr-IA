import { describe, expect, it } from 'vitest';
import type {
  AnomalyFlag,
  Completeness,
  ConsistencyEvidence,
  DamageEvidence,
} from '@sinistria/contracts';
import { evaluateTrustGates, type TrustGateInput } from './trust-gates.js';

const cleanConsistency: ConsistencyEvidence = { checks: [], contradictions: 0, benignGaps: 0 };
const cleanCompleteness: Completeness = { score: 100, missing: [] };
const cleanDamage: DamageEvidence = {
  regions: [],
  severityRange: { min: 'cosmetic', max: 'cosmetic' },
};

const clean: TrustGateInput = {
  consistency: cleanConsistency,
  anomalies: [],
  damage: cleanDamage,
  completeness: cleanCompleteness,
  confidenceScore: 0.9,
};

const highAnomaly: AnomalyFlag = {
  type: 'reused_image',
  description: 'An uploaded image matches one submitted in an earlier claim.',
  severity: 'high',
};

describe('evaluateTrustGates', () => {
  it('fires no gates for a clean, high-confidence claim', () => {
    expect(evaluateTrustGates(clean)).toEqual([]);
  });

  it('fires contradictory_evidence when consistency reports a contradiction', () => {
    const reasons = evaluateTrustGates({
      ...clean,
      consistency: { ...cleanConsistency, contradictions: 1 },
    });
    expect(reasons).toContain('contradictory_evidence');
  });

  it('fires unusual_pattern for a high-severity anomaly', () => {
    const reasons = evaluateTrustGates({ ...clean, anomalies: [highAnomaly] });
    expect(reasons).toContain('unusual_pattern');
  });

  it('does not fire unusual_pattern for a low-severity anomaly', () => {
    const reasons = evaluateTrustGates({
      ...clean,
      anomalies: [{ ...highAnomaly, severity: 'low' }],
    });
    expect(reasons).not.toContain('unusual_pattern');
  });

  it('fires potential_hidden_damage when visible severity reaches severe', () => {
    const reasons = evaluateTrustGates({
      ...clean,
      damage: { ...cleanDamage, severityRange: { min: 'cosmetic', max: 'severe' } },
    });
    expect(reasons).toContain('potential_hidden_damage');
  });

  it('fires low_confidence below the shared threshold (0.5)', () => {
    const reasons = evaluateTrustGates({ ...clean, confidenceScore: 0.4 });
    expect(reasons).toContain('low_confidence');
  });

  it('does not fire low_confidence exactly at the threshold', () => {
    const reasons = evaluateTrustGates({ ...clean, confidenceScore: 0.5 });
    expect(reasons).not.toContain('low_confidence');
  });

  it('fires every applicable gate at once when all signals are bad', () => {
    const reasons = evaluateTrustGates({
      consistency: { ...cleanConsistency, contradictions: 2 },
      anomalies: [highAnomaly],
      damage: { ...cleanDamage, severityRange: { min: 'moderate', max: 'severe' } },
      completeness: cleanCompleteness,
      confidenceScore: 0.1,
    });
    expect(reasons.sort()).toEqual(
      [
        'contradictory_evidence',
        'low_confidence',
        'potential_hidden_damage',
        'unusual_pattern',
      ].sort(),
    );
  });
});
