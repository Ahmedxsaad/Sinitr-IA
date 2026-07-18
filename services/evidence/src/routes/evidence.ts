/**
 * HTTP surface for evidence. Thin: validate against the shared schema, delegate
 * to core.
 */
import { evidenceRequestSchema } from '@sinistria/contracts';
import type { FastifyInstance } from 'fastify';
import { processEvidence } from '../core/process.js';

export function registerEvidenceRoutes(app: FastifyInstance): void {
  app.post('/evidence', async (request, reply) => {
    const parsed = evidenceRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply
        .status(400)
        .send({ error: 'Invalid evidence request', issues: parsed.error.issues });
    }
    const result = await processEvidence(parsed.data);
    return reply.send(result);
  });
}
