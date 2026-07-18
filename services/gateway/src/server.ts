/**
 * Gateway service entry point. This is the only service exposed to the frontends.
 */
import { getConfig } from '@sinistria/config';
import { createServer, start } from '@sinistria/service-kit';
import { registerGatewayRoutes } from './routes/claims.js';
import { registerMetricsRoutes } from './routes/metrics.js';
import { registerSignalsRoutes } from './routes/signals.js';

const app = createServer({
  name: 'gateway',
  register: async (instance) => {
    await registerGatewayRoutes(instance);
    await registerMetricsRoutes(instance);
    await registerSignalsRoutes(instance);
  },
});

start(app, getConfig().GATEWAY_PORT).catch((error: unknown) => {
  app.log.error({ err: error }, 'gateway failed to start');
  process.exit(1);
});
