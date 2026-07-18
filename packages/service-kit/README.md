# packages/service-kit

The shared Fastify bootstrap used by every backend service: a health endpoint, a
per-request correlation id, structured error responses, and graceful shutdown.
Each service supplies only its name and route registration.

Follows the monorepo's shared conventions (see [../../docs/conventions.md](../../docs/conventions.md)).
