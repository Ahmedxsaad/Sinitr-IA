/**
 * HTTP surface for the live metrics strip (see improvements P2.6). Thin:
 * authorize, aggregate, respond. Gated like the other adjuster routes outside
 * demo mode (see D-0010), since aggregate claim volume is still business data.
 */
import type { FastifyInstance } from 'fastify';
import { isAuthorizedAdjuster } from '../core/authz.js';
import { computeMetrics } from '../core/metrics.js';
import { claimStore } from '../core/store.js';

export function registerMetricsRoutes(app: FastifyInstance): void {
  app.get('/api/metrics', async (request, reply) => {
    if (!isAuthorizedAdjuster(request)) {
      return reply.status(401).send({ error: 'Adjuster authorization required.' });
    }
    return computeMetrics(claimStore.list());
  });
}
