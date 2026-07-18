import { describe, expect, it } from 'vitest';
import { computeConfidenceScore, type ConfidenceSignals } from './score.js';

const clean: ConfidenceSignals = {
  contradictions: 0,
  highSeverityAnomalies: 0,
  completeness: 100,
  severeDamage: false,
};

describe('computeConfidenceScore', () => {
  it('scores 0.9 for a fully clean, fully complete claim', () => {
    expect(computeConfidenceScore(clean)).toBeCloseTo(0.9);
  });

  it('subtracts 0.4 per contradiction', () => {
    expect(computeConfidenceScore({ ...clean, contradictions: 1 })).toBeCloseTo(0.5);
  });

  it('subtracts 0.3 per high-severity anomaly', () => {
    expect(computeConfidenceScore({ ...clean, highSeverityAnomalies: 1 })).toBeCloseTo(0.6);
  });

  it('subtracts 0.2 flat for severe visible damage', () => {
    expect(computeConfidenceScore({ ...clean, severeDamage: true })).toBeCloseTo(0.7);
  });

  it('scales the whole score by completeness', () => {
    expect(computeConfidenceScore({ ...clean, completeness: 50 })).toBeCloseTo(0.45);
  });

  it('clamps to 0 when penalties would drive the score negative', () => {
    expect(computeConfidenceScore({ ...clean, contradictions: 3 })).toBe(0);
  });

  it('clamps to 0 when completeness is 0, regardless of other signals', () => {
    expect(computeConfidenceScore({ ...clean, completeness: 0 })).toBe(0);
  });

  it('combines multiple penalties before scaling by completeness', () => {
    // 0.9 - 0.4 (1 contradiction) - 0.3 (1 anomaly) - 0.2 (severe) = 0, then * (80/100) = 0.
    const result = computeConfidenceScore({
      contradictions: 1,
      highSeverityAnomalies: 1,
      severeDamage: true,
      completeness: 80,
    });
    expect(result).toBeCloseTo(0);
  });

  it('never returns a value outside the 0 to 1 range', () => {
    const result = computeConfidenceScore({
      contradictions: 10,
      highSeverityAnomalies: 10,
      severeDamage: true,
      completeness: 100,
    });
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(1);
  });
});
