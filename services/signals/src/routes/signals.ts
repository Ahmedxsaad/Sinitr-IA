/**
 * HTTP surface for the signals service. Thin: validate the region, delegate to
 * core, respond.
 */
import { signalRegionSchema } from '@sinistria/contracts';
import type { FastifyInstance } from 'fastify';
import { processSignals } from '../core/process.js';

export function registerSignalsRoutes(app: FastifyInstance): void {
  app.get('/signals', async (request, reply) => {
    const parsed = signalRegionSchema.safeParse(
      (request.query as { region?: string } | undefined)?.region,
    );
    if (!parsed.success) {
      return reply
        .status(400)
        .send({ error: 'Invalid or missing region', issues: parsed.error.issues });
    }
    return processSignals(parsed.data);
  });
}
