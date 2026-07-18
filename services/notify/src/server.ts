/**
 * Notify service entry point.
 */
import { getConfig } from '@sinistria/config';
import { createServer, start } from '@sinistria/service-kit';
import { registerNotifyRoutes } from './routes/notify.js';

const app = createServer({ name: 'notify', register: registerNotifyRoutes });

start(app, getConfig().NOTIFY_PORT).catch((error: unknown) => {
  app.log.error({ err: error }, 'notify failed to start');
  process.exit(1);
});
