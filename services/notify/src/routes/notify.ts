/**
 * HTTP surface for notify. Thin: validate against the shared schema, delegate to
 * core.
 */
import { notifyRequestSchema } from '@sinistria/contracts';
import type { FastifyInstance } from 'fastify';
import { processNotify } from '../core/process.js';

export function registerNotifyRoutes(app: FastifyInstance): void {
  app.post('/notify', async (request, reply) => {
    const parsed = notifyRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply
        .status(400)
        .send({ error: 'Invalid notify request', issues: parsed.error.issues });
    }
    const result = await processNotify(parsed.data);
    return reply.send(result);
  });
}
