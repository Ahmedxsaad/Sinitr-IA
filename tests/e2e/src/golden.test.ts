/**
 * Golden-file tests for the two hero cases (see improvements P1.3). The
 * expected Accident Evidence Twin for each case is stored as a fixture and
 * manually verified against the trust-gate and recommendation rules once; this
 * test proves the pipeline still reproduces it. Day-3 hardening is where demos
 * break, so a regression here fails in seconds instead of on stage.
 */
import { describe, expect, it } from 'vitest';
import { type AccidentEvidenceTwin, createClaimRequestSchema } from '@sinistria/contracts';
import { processIntake } from '@sinistria/intake/core';
import { processEvidence } from '@sinistria/evidence/core';
import { processGraph } from '@sinistria/graph/core';
import { processRecommend } from '@sinistria/claims/core';
import { processNotify } from '@sinistria/notify/core';
import { type ServiceClients, runClaimPipeline } from '@sinistria/gateway/core';
import honestFixture from '../../../data/claims/honest.json';
import suspiciousFixture from '../../../data/claims/suspicious.json';
import honestExpected from '../../../data/claims/honest.expected-twin.json';
import suspiciousExpected from '../../../data/claims/suspicious.expected-twin.json';

const clients: ServiceClients = {
  intake: (request) => processIntake(request),
  evidence: (request) => processEvidence(request),
  graph: (request) => processGraph(request),
  claims: (request) => processRecommend(request),
  notify: (request) => processNotify(request),
};

const honest = createClaimRequestSchema.parse(honestFixture);
const suspicious = createClaimRequestSchema.parse(suspiciousFixture);

/**
 * Replace every wall-clock timestamp with a fixed placeholder. `createdAt`,
 * `updatedAt`, every audit entry's `at`, and the derived `occurredAt` are
 * generated at run time, so a golden fixture cannot pin an exact value; it
 * pins everything else instead.
 */
function normalizeTimestamps(twin: AccidentEvidenceTwin): unknown {
  return {
    ...twin,
    createdAt: 'TIMESTAMP',
    updatedAt: 'TIMESTAMP',
    structuredFacts: twin.structuredFacts && {
      ...twin.structuredFacts,
      occurredAt: { ...twin.structuredFacts.occurredAt, value: 'TIMESTAMP' },
    },
    audit: twin.audit.map((entry) => ({ ...entry, at: 'TIMESTAMP' })),
  };
}

describe('golden Twin fixtures', () => {
  it('reproduces the honest case exactly, modulo timestamps', async () => {
    const twin = await runClaimPipeline(
      honest,
      { claimId: 'CLM-GOLDEN-HONEST', correlationId: 'corr-golden-honest' },
      clients,
    );
    expect(normalizeTimestamps(twin)).toEqual(honestExpected);
  });

  it('reproduces the suspicious case exactly, modulo timestamps', async () => {
    const twin = await runClaimPipeline(
      suspicious,
      { claimId: 'CLM-GOLDEN-SUSPICIOUS', correlationId: 'corr-golden-suspicious' },
      clients,
    );
    expect(normalizeTimestamps(twin)).toEqual(suspiciousExpected);
  });
});
