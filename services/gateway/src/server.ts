/**
 * Gateway service entry point. This is the only service exposed to the frontends.
 */
import { getConfig } from '@sinistria/config';
import { createServer, start } from '@sinistria/service-kit';
import { createHttpClients } from './core/clients.js';
import { seedDemoQueue } from './core/seed.js';
import { claimStore } from './core/store.js';
import { registerGatewayRoutes } from './routes/claims.js';
import { registerMetricsRoutes } from './routes/metrics.js';
import { registerSignalsRoutes } from './routes/signals.js';

const clients = createHttpClients();

// Registered before service-kit's own shutdown handler, so the SQLite file
// closes cleanly before the process exits (better-sqlite3's close is
// synchronous, so this always finishes first within the same event tick).
process.on('SIGTERM', () => claimStore.close());
process.on('SIGINT', () => claimStore.close());

const app = createServer({
  name: 'gateway',
  register: async (instance) => {
    await registerGatewayRoutes(instance, clients);
    await registerMetricsRoutes(instance);
    await registerSignalsRoutes(instance);
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
