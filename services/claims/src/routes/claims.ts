/**
 * HTTP surface for claims. Thin: validate against the shared schema, delegate to
 * core.
 */
import { recommendRequestSchema } from '@sinistria/contracts';
import type { FastifyInstance } from 'fastify';
import { processRecommend } from '../core/process.js';

export function registerClaimsRoutes(app: FastifyInstance): void {
  app.post('/recommend', async (request, reply) => {
    const parsed = recommendRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply
        .status(400)
        .send({ error: 'Invalid recommend request', issues: parsed.error.issues });
    }
    const result = await processRecommend(parsed.data);
    return reply.send(result);
  });
}
