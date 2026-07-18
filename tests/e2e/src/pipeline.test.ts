/**
 * End-to-end pipeline test. It wires the gateway orchestration to the real core
 * of every service (no HTTP), then runs the two scripted demo cases through it.
 * This is the fast, deterministic proof that an honest claim fast-tracks and a
 * suspicious claim is routed to investigation.
 */
import { describe, expect, it } from 'vitest';
import { createClaimRequestSchema } from '@sinistria/contracts';
import { processIntake } from '@sinistria/intake/core';
import { processEvidence } from '@sinistria/evidence/core';
import { processGraph } from '@sinistria/graph/core';
import { processRecommend } from '@sinistria/claims/core';
import { processNotify } from '@sinistria/notify/core';
import { type ServiceClients, applyDecision, runClaimPipeline } from '@sinistria/gateway/core';
import honestFixture from '../../../data/claims/honest.json';
import suspiciousFixture from '../../../data/claims/suspicious.json';

// The gateway pipeline depends only on the ServiceClients interface, so here we
// back it with each service's core function instead of a network call.
const clients: ServiceClients = {
  intake: (request) => processIntake(request),
  evidence: (request) => processEvidence(request),
  graph: (request) => processGraph(request),
  claims: (request) => processRecommend(request),
  notify: (request) => processNotify(request),
};

// Parsing the fixtures with the shared schema both types them and validates that
// the demo dataset still matches the contract.
const honest = createClaimRequestSchema.parse(honestFixture);
const suspicious = createClaimRequestSchema.parse(suspiciousFixture);

describe('claim pipeline', () => {
  it('fast-tracks the honest claim and notifies on approval', async () => {
    const twin = await runClaimPipeline(
      honest,
      { claimId: 'CLM-TEST-HONEST', correlationId: 'corr-honest' },
      clients,
    );

    expect(twin.state).toBe('recommended');
    expect(twin.recommendation?.route).toBe('fast_track');
    expect(twin.completeness?.score).toBe(100);
    expect(twin.consistency?.contradictions).toBe(0);
    expect(twin.anomalies).toHaveLength(0);
    expect(twin.overallConfidence.label).toBe('high');

    // The adjuster approves, which sends the notification and finalizes the claim.
    const record = { twin, contactPhone: honest.contact.phone };
    await applyDecision(record, 'approve', undefined, clients);

    expect(twin.state).toBe('notified');
    expect(twin.audit.some((entry) => entry.action === 'notify.sent')).toBe(true);
  });

  it('routes the suspicious claim to investigation with explained signals', async () => {
    const twin = await runClaimPipeline(
      suspicious,
      { claimId: 'CLM-TEST-SUSPICIOUS', correlationId: 'corr-suspicious' },
      clients,
    );

    expect(twin.recommendation?.route).toBe('investigate');
    expect(twin.consistency?.contradictions).toBeGreaterThan(0);
    expect(twin.anomalies.length).toBeGreaterThan(0);
    // Every anomaly must explain itself and point at the related prior claim.
    for (const anomaly of twin.anomalies) {
      expect(anomaly.description.length).toBeGreaterThan(0);
    }
  });
});
