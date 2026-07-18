import { describe, expect, it } from 'vitest';
import type { DamageRegion, Fnol, ImpactArea } from '@sinistria/contracts';
import type { ExtractedDocument } from '../adapters/ocr.js';
import { areasConsistent, checkConsistency } from './consistency.js';

const region = (
  area: ImpactArea,
  severity: DamageRegion['severity'] = 'cosmetic',
): DamageRegion => ({
  area,
  severity,
  confidence: { label: 'high', score: 0.9 },
});

function fnolWithDirection(direction: ImpactArea): Fnol {
  return {
    structuredFacts: {
      claimantStatement: {
        value: 'text',
        source: 'voice',
        confidence: { label: 'high', score: 0.9 },
      },
      occurredAt: {
        value: new Date().toISOString(),
        source: 'metadata',
        confidence: { label: 'high', score: 0.9 },
      },
      location: { value: 'Unknown', source: 'derived', confidence: { label: 'low', score: 0.3 } },
      vehicles: [{ plate: 'UNKNOWN', isClaimant: true }],
    },
    timeline: {
      summary: { value: 'text', source: 'voice', confidence: { label: 'high', score: 0.9 } },
      sequence: ['a', 'b', 'c'],
      collisionDirection: {
        value: direction,
        source: 'voice',
        confidence: { label: 'high', score: 0.9 },
      },
    },
  };
}

describe('areasConsistent', () => {
  it('treats an unknown direction as consistent with anything', () => {
    expect(areasConsistent('unknown', 'front_left')).toBe(true);
  });

  it('treats an exact match as consistent', () => {
    expect(areasConsistent('rear_left', 'rear_left')).toBe(true);
  });

  it('treats the same axis (rear) as consistent even with a different side', () => {
    expect(areasConsistent('rear_left', 'rear_right')).toBe(true);
  });

  it('treats opposite axes (front vs rear) as inconsistent', () => {
    expect(areasConsistent('rear_left', 'front_right')).toBe(false);
  });

  it('treats a bare side (no axis) as inconsistent with a front/rear direction', () => {
    // 'left' alone has no front/rear axis, so it cannot confirm a 'rear_left' story.
    expect(areasConsistent('rear_left', 'left')).toBe(false);
  });
});

describe('checkConsistency', () => {
  it('reports a benign gap on both checks when there is no image or invoice', () => {
    const evidence = checkConsistency(fnolWithDirection('rear_left'), [], []);
    expect(evidence.contradictions).toBe(0);
    expect(evidence.benignGaps).toBe(2);
    expect(evidence.checks.every((check) => check.status === 'benign_gap')).toBe(true);
  });

  it('reports consistent when the damage location matches the stated direction', () => {
    const evidence = checkConsistency(fnolWithDirection('rear_left'), [region('rear_left')], []);
    const directionCheck = evidence.checks.find((check) => check.id === 'direction_vs_damage');
    expect(directionCheck?.status).toBe('consistent');
    expect(evidence.contradictions).toBe(0);
  });

  it('reports inconsistent when the damage location contradicts the stated direction', () => {
    const evidence = checkConsistency(fnolWithDirection('rear_left'), [region('front_right')], []);
    const directionCheck = evidence.checks.find((check) => check.id === 'direction_vs_damage');
    expect(directionCheck?.status).toBe('inconsistent');
    expect(evidence.contradictions).toBe(1);
  });

  it('reports consistent for a light-damage invoice with a body panel category', () => {
    const documents: ExtractedDocument[] = [{ type: 'invoice', category: 'body_panel' }];
    const evidence = checkConsistency(
      fnolWithDirection('rear_left'),
      [region('rear_left', 'cosmetic')],
      documents,
    );
    const invoiceCheck = evidence.checks.find((check) => check.id === 'invoice_vs_damage');
    expect(invoiceCheck?.status).toBe('consistent');
  });

  it('reports inconsistent for a mechanical invoice against light visible damage', () => {
    const documents: ExtractedDocument[] = [{ type: 'invoice', category: 'engine' }];
    const evidence = checkConsistency(
      fnolWithDirection('rear_left'),
      [region('rear_left', 'cosmetic')],
      documents,
    );
    const invoiceCheck = evidence.checks.find((check) => check.id === 'invoice_vs_damage');
    expect(invoiceCheck?.status).toBe('inconsistent');
    expect(evidence.contradictions).toBe(1);
  });

  it('reports consistent for a mechanical invoice against severe visible damage', () => {
    const documents: ExtractedDocument[] = [{ type: 'invoice', category: 'engine' }];
    const evidence = checkConsistency(
      fnolWithDirection('rear_left'),
      [region('rear_left', 'severe')],
      documents,
    );
    const invoiceCheck = evidence.checks.find((check) => check.id === 'invoice_vs_damage');
    expect(invoiceCheck?.status).toBe('consistent');
  });

  it('never labels a check as accusatory (uses neutral inconsistency language)', () => {
    const evidence = checkConsistency(fnolWithDirection('rear_left'), [region('front_right')], []);
    for (const check of evidence.checks) {
      expect(check.detail.toLowerCase()).not.toMatch(/lying|fraud|fake|liar/);
    }
  });
});
