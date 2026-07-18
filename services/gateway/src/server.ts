/**
 * Gateway service entry point. This is the only service exposed to the frontends.
 */
import { getConfig } from '@sinistria/config';
import { createServer, start } from '@sinistria/service-kit';
import { createHttpClients } from './core/clients.js';
import { seedDemoQueue } from './core/seed.js';
import { registerGatewayRoutes } from './routes/claims.js';
import { registerMetricsRoutes } from './routes/metrics.js';

const clients = createHttpClients();

const app = createServer({
  name: 'gateway',
  register: async (instance) => {
    await registerGatewayRoutes(instance, clients);
    await registerMetricsRoutes(instance);
  },
});

start(app, getConfig().GATEWAY_PORT)
  .then(() => {
    // Seed in the background: the health endpoint must answer immediately, and
    // a dependency not up yet must not block or fail the gateway's own boot.
    if (getConfig().DEMO_MODE) {
      void seedDemoQueue(clients, app.log).catch((error: unknown) => {
        app.log.warn({ err: error }, 'demo queue seeding failed');
      });
    }
  })
  .catch((error: unknown) => {
    app.log.error({ err: error }, 'gateway failed to start');
    process.exit(1);
  });
