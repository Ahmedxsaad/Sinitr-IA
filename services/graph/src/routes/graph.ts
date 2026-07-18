/**
 * HTTP surface for graph. Thin: validate against the shared schema, delegate to
 * core.
 */
import { graphRequestSchema } from '@sinistria/contracts';
import type { FastifyInstance } from 'fastify';
import { processGraph } from '../core/process.js';

export function registerGraphRoutes(app: FastifyInstance): void {
  app.post('/graph', async (request, reply) => {
    const parsed = graphRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply
        .status(400)
        .send({ error: 'Invalid graph request', issues: parsed.error.issues });
    }
    const result = await processGraph(parsed.data);
    return reply.send(result);
  });
}
