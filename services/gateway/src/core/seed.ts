/**
 * Demo-mode boot seeding. Runs every manifest claim through the real pipeline
 * at gateway startup so the cockpit opens with a realistic, varied queue
 * instead of an empty one, rather than a demo depending on someone submitting
 * the first live claim on stage. Never runs outside DEMO_MODE.
 */
import { getServiceUrls } from '@sinistria/config';
import { createClaimRequestSchema, fixtureManifestSchema } from '@sinistria/contracts';
import type { FastifyBaseLogger } from 'fastify';
import manifest from '../../../../data/manifest.json';
import honestClaim from '../../../../data/claims/honest.json';
import suspiciousClaim from '../../../../data/claims/suspicious.json';
import injuryClaim from '../../../../data/claims/injury.json';
import fireClaim from '../../../../data/claims/fire.json';
import rolloverClaim from '../../../../data/claims/rollover.json';
import sparseClaim from '../../../../data/claims/sparse.json';
import noInvoiceClaim from '../../../../data/claims/no-invoice.json';
import severeClaim from '../../../../data/claims/severe.json';
import honestFrClaim from '../../../../data/claims/honest-fr.json';
import invoiceMismatchClaim from '../../../../data/claims/invoice-mismatch.json';
import type { ServiceClients } from './clients.js';
import { runClaimPipeline } from './pipeline.js';
import { claimStore } from './store.js';

// Maps a manifest claim id to its fixture module. Mirrors the mapping in
// tests/e2e/src/fixtures.test.ts; both read the same manifest as the single
// list of what the dataset contains, so the two cannot drift silently.
const CLAIM_FIXTURES: Record<string, unknown> = {
  honest: honestClaim,
  suspicious: suspiciousClaim,
  injury: injuryClaim,
  fire: fireClaim,
  rollover: rolloverClaim,
  sparse: sparseClaim,
  'no-invoice': noInvoiceClaim,
  severe: severeClaim,
  'honest-fr': honestFrClaim,
  'invoice-mismatch': invoiceMismatchClaim,
};

const parsedManifest = fixtureManifestSchema.parse(manifest);

/** Poll a service's health endpoint until it answers or the attempts run out. */
async function waitUntilHealthy(url: string, attempts: number, delayMs: number): Promise<boolean> {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(`${url}/health`);
      if (response.ok) return true;
    } catch {
      // Not reachable yet; retry after the delay below.
    }
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  return false;
}

/**
 * Seed the demo queue by running every manifest claim through the real
 * pipeline over the gateway's normal HTTP clients (no self-call to the
 * gateway's own API). Each claim gets a stable id derived from the manifest,
 * so a restart reproduces the same queue instead of accumulating duplicates.
 * A single claim's failure, or a dependency not reachable yet, is logged and
 * skipped rather than crashing the gateway.
 */
export async function seedDemoQueue(
  clients: ServiceClients,
  logger: FastifyBaseLogger,
): Promise<void> {
  const urls = getServiceUrls();
  const dependencies = [urls.intake, urls.evidence, urls.graph, urls.claims];
  const healthy = await Promise.all(dependencies.map((url) => waitUntilHealthy(url, 30, 500)));
  if (!healthy.every(Boolean)) {
    logger.warn('demo queue seeding skipped: not every dependent service became healthy in time');
    return;
  }

  let seeded = 0;
  for (const entry of parsedManifest.claims) {
    const fixture = CLAIM_FIXTURES[entry.id];
    if (!fixture) continue;
    try {
      const claim = createClaimRequestSchema.parse(fixture);
      const ids = {
        claimId: `CLM-DEMO-${entry.id.toUpperCase()}`,
        correlationId: `seed-${entry.id}`,
      };
      const twin = await runClaimPipeline(claim, ids, clients);
      claimStore.save({ twin, contactPhone: claim.contact.phone });
      seeded += 1;
    } catch (error) {
      logger.warn({ err: error, claimId: entry.id }, 'failed to seed demo claim');
    }
  }
  logger.info({ seeded }, 'demo queue seeded');
}
