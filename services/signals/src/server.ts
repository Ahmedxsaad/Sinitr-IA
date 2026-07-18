/**
 * Signals service entry point. Standalone situational-awareness feed; it is not
 * part of the claim pipeline and holds no claim data.
 */
import { getConfig } from '@sinistria/config';
import { createServer, start } from '@sinistria/service-kit';
import { registerSignalsRoutes } from './routes/signals.js';

const app = createServer({ name: 'signals', register: registerSignalsRoutes });

start(app, getConfig().SIGNALS_PORT).catch((error: unknown) => {
  app.log.error({ err: error }, 'signals failed to start');
  process.exit(1);
});
