/**
 * Intake service entry point. The shared service kit handles the Fastify setup,
 * health endpoint, correlation id, and graceful shutdown.
 */
import { getConfig } from '@sinistria/config';
import { createServer, start } from '@sinistria/service-kit';
import { registerIntakeRoutes } from './routes/intake.js';

const app = createServer({ name: 'intake', register: registerIntakeRoutes });

start(app, getConfig().INTAKE_PORT).catch((error: unknown) => {
  app.log.error({ err: error }, 'intake failed to start');
  process.exit(1);
});
