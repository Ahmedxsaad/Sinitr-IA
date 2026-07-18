/**
 * Claims service entry point.
 */
import { getConfig } from '@sinistria/config';
import { createServer, start } from '@sinistria/service-kit';
import { registerClaimsRoutes } from './routes/claims.js';

const app = createServer({ name: 'claims', register: registerClaimsRoutes });

start(app, getConfig().CLAIMS_PORT).catch((error: unknown) => {
  app.log.error({ err: error }, 'claims failed to start');
  process.exit(1);
});
