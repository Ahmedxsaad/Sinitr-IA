import { describe, expect, it } from 'vitest';
import type { AccidentEvidenceTwin, ClaimRoute } from '@sinistria/contracts';
import { makeConfidence } from '@sinistria/contracts';
import type { ClaimRecord } from './store.js';
import { computeMetrics } from './metrics.js';

/** A minimal, otherwise-empty Twin so each test only overrides what it needs. */
function buildTwin(overrides: Partial<AccidentEvidenceTwin>): AccidentEvidenceTwin {
  return {
    claimId: 'CLM-TEST',
    correlationId: 'corr-test',
    state: 'recommended',
    locale: 'derja',
    createdAt: '2026-07-18T10:00:00.000Z',
    updatedAt: '2026-07-18T10:00:00.000Z',
    structuredFacts: null,
    timeline: null,
    damage: null,
    coverage: null,
    consistency: null,
    completeness: null,
    anomalies: [],
    graphView: null,
    recommendation: null,
    overallConfidence: makeConfidence(0.5),
    audit: [],
    ...overrides,
  };
}

function buildRecord(overrides: Partial<AccidentEvidenceTwin>): ClaimRecord {
  return { twin: buildTwin(overrides), contactPhone: '+21620000000' };
}

function recommendation(route: ClaimRoute) {
  return {
    route,
    reasons: ['test reason'],
    escalationReasons: [],
    confidence: makeConfidence(0.8),
    draftCustomerMessage: 'test message',
  };
}

describe('computeMetrics', () => {
  it('returns zero counts and null averages for an empty store', () => {
    const metrics = computeMetrics([]);
    expect(metrics.totalClaims).toBe(0);
    expect(metrics.averageTimeToFnolMs).toBeNull();
    expect(metrics.averageEvidenceCompleteness).toBeNull();
    expect(metrics.routeCounts).toEqual({ fast_track: 0, review: 0, investigate: 0 });
  });

  it('averages time to FNOL from the claim.created and intake.structured audit entries', () => {
    const record = buildRecord({
      audit: [
        { at: '2026-07-18T10:00:00.000Z', actor: 'gateway', action: 'claim.created' },
        { at: '2026-07-18T10:00:05.000Z', actor: 'intake', action: 'intake.structured' },
      ],
    });
    const metrics = computeMetrics([record]);
    expect(metrics.averageTimeToFnolMs).toBe(5_000);
  });

  it('excludes a claim missing either audit entry from the time-to-FNOL average', () => {
    const withBoth = buildRecord({
      audit: [
        { at: '2026-07-18T10:00:00.000Z', actor: 'gateway', action: 'claim.created' },
        { at: '2026-07-18T10:00:10.000Z', actor: 'intake', action: 'intake.structured' },
      ],
    });
    const missingStructured = buildRecord({
      audit: [{ at: '2026-07-18T10:00:00.000Z', actor: 'gateway', action: 'claim.created' }],
    });
    const metrics = computeMetrics([withBoth, missingStructured]);
    expect(metrics.averageTimeToFnolMs).toBe(10_000);
  });

  it('averages evidence completeness only across claims that reached evidence', () => {
    const withCompleteness = buildRecord({ completeness: { score: 80, missing: [] } });
    const escalated = buildRecord({ state: 'escalated', completeness: null });
    const metrics = computeMetrics([withCompleteness, escalated]);
    expect(metrics.averageEvidenceCompleteness).toBe(80);
    expect(metrics.totalClaims).toBe(2);
  });

  it('tallies route counts across every claim with a recommendation', () => {
    const records = [
      buildRecord({ recommendation: recommendation('fast_track') }),
      buildRecord({ recommendation: recommendation('fast_track') }),
      buildRecord({ recommendation: recommendation('review') }),
      buildRecord({ recommendation: recommendation('investigate') }),
    ];
    const metrics = computeMetrics(records);
    expect(metrics.routeCounts).toEqual({ fast_track: 2, review: 1, investigate: 1 });
    expect(metrics.totalClaims).toBe(4);
  });

  it('does not count a claim with no recommendation yet in any route', () => {
    const record = buildRecord({ recommendation: null });
    const metrics = computeMetrics([record]);
    expect(metrics.routeCounts).toEqual({ fast_track: 0, review: 0, investigate: 0 });
    expect(metrics.totalClaims).toBe(1);
  });
});
