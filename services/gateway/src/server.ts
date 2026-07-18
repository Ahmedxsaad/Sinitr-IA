/**
 * Gateway service entry point. This is the only service exposed to the frontends.
 */
import { getConfig } from '@sinistria/config';
import { createServer, start } from '@sinistria/service-kit';
import { registerGatewayRoutes } from './routes/claims.js';

const app = createServer({ name: 'gateway', register: registerGatewayRoutes });

start(app, getConfig().GATEWAY_PORT).catch((error: unknown) => {
  app.log.error({ err: error }, 'gateway failed to start');
  process.exit(1);
});
