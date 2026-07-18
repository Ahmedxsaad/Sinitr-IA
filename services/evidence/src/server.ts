/**
 * Evidence service entry point.
 */
import { getConfig } from '@sinistria/config';
import { createServer, start } from '@sinistria/service-kit';
import { registerEvidenceRoutes } from './routes/evidence.js';

const app = createServer({ name: 'evidence', register: registerEvidenceRoutes });

start(app, getConfig().EVIDENCE_PORT).catch((error: unknown) => {
  app.log.error({ err: error }, 'evidence failed to start');
  process.exit(1);
});
