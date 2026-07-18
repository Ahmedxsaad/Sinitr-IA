/**
 * Graph service entry point.
 */
import { getConfig } from '@sinistria/config';
import { createServer, start } from '@sinistria/service-kit';
import { registerGraphRoutes } from './routes/graph.js';

const app = createServer({ name: 'graph', register: registerGraphRoutes });

start(app, getConfig().GRAPH_PORT).catch((error: unknown) => {
  app.log.error({ err: error }, 'graph failed to start');
  process.exit(1);
});
