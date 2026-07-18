/**
 * Read-through route for the situational-awareness feed. The gateway stays the
 * only entry point for the cockpit (architecture principle), so it proxies to
 * the standalone signals service rather than the browser calling it directly.
 * Additive: this touches no claim data and no other route. Gated like the other
 * adjuster-facing routes (see D-0010).
 */
import { getConfig } from '@sinistria/config';
import { signalRegionSchema } from '@sinistria/contracts';
import type { FastifyInstance } from 'fastify';
import { isAuthorizedAdjuster } from '../core/authz.js';

export function registerSignalsRoutes(app: FastifyInstance): void {
  app.get('/api/signals', async (request, reply) => {
    if (!isAuthorizedAdjuster(request)) {
      return reply.status(401).send({ error: 'Adjuster authorization required.' });
    }
    const region = signalRegionSchema
      .catch('tunisia')
      .parse((request.query as { region?: string } | undefined)?.region);

    const url = `${getConfig().SIGNALS_URL}/signals?region=${region}`;
    const response = await fetch(url, {
      headers: { 'x-correlation-id': request.correlationId },
    });
    if (!response.ok) {
      const detail = await response.text();
      request.log.error({ status: response.status, detail }, 'signals service call failed');
      return reply.status(502).send({ error: 'Signals service is unavailable.' });
    }
    return reply.send(await response.json());
  });
}
