/**
 * Shared Fastify bootstrap for every backend service. Centralizes the
 * cross-cutting concerns so each service file stays about its own domain:
 * a health endpoint, a correlation id on every request, structured error
 * responses, and graceful shutdown.
 */
import Fastify, { type FastifyError, type FastifyInstance } from 'fastify';
import { getConfig } from '@sinistria/config';
import { newCorrelationId } from '@sinistria/logger';

// Make the per-request correlation id visible to every route handler in a
// type-safe way. This augmentation loads wherever service-kit is imported.
declare module 'fastify' {
  interface FastifyRequest {
    correlationId: string;
  }
}

export interface ServiceOptions {
  /** Service name, used in logs and the health response. */
  name: string;
  /** Register the service's routes on the given instance. */
  register: (app: FastifyInstance) => Promise<void> | void;
}

/**
 * Build a configured Fastify instance for a service. The caller only supplies a
 * name and a route registration function.
 */
export function createServer(options: ServiceOptions): FastifyInstance {
  const config = getConfig();
  // Let Fastify build its own pino logger from these options. Passing a
  // pre-built pino instance instead trips a known FastifyBaseLogger type
  // mismatch, and Fastify's logger is what request.log needs anyway.
  const app = Fastify({
    logger: { level: config.LOG_LEVEL, name: options.name },
  });

  // Reuse an incoming correlation id (set by the gateway) or mint a new one, so
  // one claim can be traced across every service it touches.
  app.addHook('onRequest', async (request) => {
    const header = request.headers['x-correlation-id'];
    request.correlationId =
      typeof header === 'string' && header.length > 0 ? header : newCorrelationId();
  });

  app.get('/health', async () => ({ status: 'ok', service: options.name }));

  // Never leak stack traces to callers. Log the full error, return a clean shape.
  app.setErrorHandler((error: FastifyError, request, reply) => {
    request.log.error({ err: error, correlationId: request.correlationId }, 'request failed');
    const status = error.statusCode ?? 500;
    // Validation details are useful to callers, but unexpected failures can
    // contain provider URLs, filesystem paths, or other internal data.
    const message = status >= 500 ? 'Internal server error.' : error.message;
    void reply.status(status).send({ error: message, correlationId: request.correlationId });
  });

  void app.register(async (instance) => {
    await options.register(instance);
  });

  return app;
}

/**
 * Start listening and wire graceful shutdown so the process closes cleanly on
 * SIGTERM and SIGINT (for example when docker compose stops the container).
 */
export async function start(app: FastifyInstance, port: number): Promise<void> {
  const shutdown = async (): Promise<void> => {
    await app.close();
    process.exit(0);
  };
  process.on('SIGTERM', () => void shutdown());
  process.on('SIGINT', () => void shutdown());
  await app.listen({ port, host: '0.0.0.0' });
}
