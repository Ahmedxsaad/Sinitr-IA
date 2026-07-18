import { describe, expect, it } from 'vitest';
import type { GraphRequest } from '@sinistria/contracts';
import { detectAnomalies } from './anomalies.js';
import { SEED_GRAPH } from './seed.js';

const baseRequest: GraphRequest = {
  claimId: 'CLM-TEST',
  correlationId: 'corr-test',
  claimantPhone: '+21620000099',
  mediaRefs: [],
};

describe('detectAnomalies', () => {
  it('returns no flags for a clean claim with no seeded relationships', () => {
    expect(detectAnomalies(baseRequest)).toEqual([]);
  });

  it('flags a garage phone that matches a seeded prior claim', () => {
    const [knownPhone, priorClaim] = Object.entries(SEED_GRAPH.knownGaragePhones)[0]!;
    const flags = detectAnomalies({ ...baseRequest, garagePhone: knownPhone });
    expect(flags).toHaveLength(1);
    expect(flags[0]).toMatchObject({
      type: 'shared_garage_phone',
      severity: 'high',
      relatedClaimId: priorClaim,
    });
  });

  it('does not flag a garage phone that has no prior relationship', () => {
    const flags = detectAnomalies({ ...baseRequest, garagePhone: '+21699999999' });
    expect(flags).toHaveLength(0);
  });

  it('flags a reused image that matches a seeded prior claim', () => {
    const [knownRef, priorClaim] = Object.entries(SEED_GRAPH.knownReusedImages)[0]!;
    const flags = detectAnomalies({ ...baseRequest, mediaRefs: [knownRef] });
    expect(flags).toHaveLength(1);
    expect(flags[0]).toMatchObject({
      type: 'reused_image',
      severity: 'high',
      relatedClaimId: priorClaim,
    });
  });

  it('does not flag a media ref that has no prior relationship', () => {
    const flags = detectAnomalies({
      ...baseRequest,
      mediaRefs: ['seed:honest:vision:rear_left:cosmetic'],
    });
    expect(flags).toHaveLength(0);
  });

  it('combines a shared garage phone and a reused image into two flags', () => {
    const [knownPhone] = Object.entries(SEED_GRAPH.knownGaragePhones)[0]!;
    const [knownRef] = Object.entries(SEED_GRAPH.knownReusedImages)[0]!;
    const flags = detectAnomalies({
      ...baseRequest,
      garagePhone: knownPhone,
      mediaRefs: [knownRef],
    });
    expect(flags).toHaveLength(2);
    expect(flags.map((flag) => flag.type).sort()).toEqual(['reused_image', 'shared_garage_phone']);
  });

  it('never names the claimant in an anomaly description (evidence, not accusation)', () => {
    const [knownPhone] = Object.entries(SEED_GRAPH.knownGaragePhones)[0]!;
    const flags = detectAnomalies({ ...baseRequest, garagePhone: knownPhone });
    for (const flag of flags) {
      expect(flag.description).not.toContain(baseRequest.claimantPhone);
      expect(flag.description.toLowerCase()).not.toMatch(/fraud|lying|liar/);
    }
  });
});
