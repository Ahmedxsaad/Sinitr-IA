import { describe, expect, it } from 'vitest';
import type { DamageRegion } from '@sinistria/contracts';
import { buildDamageEvidence, maxSeverity, severityRank } from './damage.js';

const region = (
  severity: DamageRegion['severity'],
  area: DamageRegion['area'] = 'rear_left',
): DamageRegion => ({
  area,
  severity,
  confidence: { label: 'high', score: 0.9 },
});

describe('severityRank', () => {
  it('ranks severities from none to severe', () => {
    expect(severityRank('none')).toBe(0);
    expect(severityRank('cosmetic')).toBe(1);
    expect(severityRank('minor')).toBe(2);
    expect(severityRank('moderate')).toBe(3);
    expect(severityRank('severe')).toBe(4);
  });
});

describe('maxSeverity', () => {
  it('returns none for an empty region list', () => {
    expect(maxSeverity([])).toBe('none');
  });

  it('returns the single severity for one region', () => {
    expect(maxSeverity([region('moderate')])).toBe('moderate');
  });

  it('returns the highest severity across multiple regions', () => {
    expect(maxSeverity([region('cosmetic'), region('severe'), region('minor')])).toBe('severe');
  });
});

describe('buildDamageEvidence', () => {
  it('reports a none/none range and a note when there are no regions', () => {
    const evidence = buildDamageEvidence([]);
    expect(evidence.regions).toEqual([]);
    expect(evidence.severityRange).toEqual({ min: 'none', max: 'none' });
    expect(evidence.notes).toBeDefined();
  });

  it('reports the same min and max for a single region', () => {
    const evidence = buildDamageEvidence([region('cosmetic')]);
    expect(evidence.severityRange).toEqual({ min: 'cosmetic', max: 'cosmetic' });
    expect(evidence.notes).toBeUndefined();
  });

  it('reports the min and max across multiple regions of differing severity', () => {
    const evidence = buildDamageEvidence([region('minor'), region('severe'), region('cosmetic')]);
    expect(evidence.severityRange).toEqual({ min: 'cosmetic', max: 'severe' });
    expect(evidence.regions).toHaveLength(3);
  });
});
