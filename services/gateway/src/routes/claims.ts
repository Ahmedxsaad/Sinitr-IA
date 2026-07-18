/**
 * The gateway's public API for the frontends. It is the only entry point the
 * mobile app and cockpit talk to. It validates input, orchestrates the pipeline,
 * and reads or updates the in-memory demo store.
 */
import { randomUUID } from 'node:crypto';
import { adjusterDecisionRequestSchema, createClaimRequestSchema } from '@sinistria/contracts';
import { newCorrelationId } from '@sinistria/logger';
import type { FastifyInstance } from 'fastify';
import { createHttpClients } from '../core/clients.js';
import { applyDecision } from '../core/decision.js';
import { runClaimPipeline } from '../core/pipeline.js';
import { claimStore } from '../core/store.js';

const clients = createHttpClients();

/** Generate a human-friendly claim id such as "CLM-2026-4F9A2C". */
function newClaimId(): string {
  const year = new Date().getFullYear();
  const suffix = randomUUID().replace(/-/g, '').slice(0, 6).toUpperCase();
  return `CLM-${year}-${suffix}`;
}

export function registerGatewayRoutes(app: FastifyInstance): void {
  // Open a new claim: run the full pipeline and store the result.
  app.post('/api/claims', async (request, reply) => {
    const parsed = createClaimRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply
        .status(400)
        .send({ error: 'Invalid claim request', issues: parsed.error.issues });
    }
    const ids = { claimId: newClaimId(), correlationId: newCorrelationId() };
    const twin = await runClaimPipeline(parsed.data, ids, clients);
    claimStore.save({ twin, contactPhone: parsed.data.contact.phone });
    return reply.status(201).send(twin);
  });

  // List claims as compact summaries for the cockpit queue.
  app.get('/api/claims', async () => {
    return claimStore.list().map((record) => ({
      claimId: record.twin.claimId,
      state: record.twin.state,
      route: record.twin.recommendation?.route ?? null,
      overallConfidence: record.twin.overallConfidence,
      createdAt: record.twin.createdAt,
    }));
  });

  // Fetch the full Twin for the cockpit detail view.
  app.get('/api/claims/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const record = claimStore.get(id);
    if (!record) {
      return reply.status(404).send({ error: `Claim ${id} not found` });
    }
    return reply.send(record.twin);
  });

  // Apply an adjuster decision. Only a claim awaiting a decision can be acted on.
  app.post('/api/claims/:id/decision', async (request, reply) => {
    const { id } = request.params as { id: string };
    const record = claimStore.get(id);
    if (!record) {
      return reply.status(404).send({ error: `Claim ${id} not found` });
    }
    if (record.twin.state !== 'recommended') {
      return reply
        .status(409)
        .send({ error: `Claim ${id} is not awaiting a decision (state: ${record.twin.state})` });
    }
    const parsed = adjusterDecisionRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid decision', issues: parsed.error.issues });
    }
    await applyDecision(record, parsed.data.action, parsed.data.note, clients);
    claimStore.save(record);
    return reply.send(record.twin);
  });
}
