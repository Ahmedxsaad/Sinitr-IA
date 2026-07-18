/**
 * HTTP surface for intake. The route is intentionally thin: validate the input
 * against the shared schema, then hand off to the core. All logic lives in core.
 */
import { intakeRequestSchema } from '@sinistria/contracts';
import type { FastifyInstance } from 'fastify';
import { processIntake } from '../core/process.js';

export function registerIntakeRoutes(app: FastifyInstance): void {
  app.post('/intake', async (request, reply) => {
    // Validate at the boundary so malformed calls fail here, not deeper in.
    const parsed = intakeRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply
        .status(400)
        .send({ error: 'Invalid intake request', issues: parsed.error.issues });
    }
    const result = await processIntake(parsed.data);
    return reply.send(result);
  });
}
