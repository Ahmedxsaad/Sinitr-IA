/**
 * Structured logging built on pino. Every service creates one root logger, then
 * derives a per-claim child logger that stamps the correlation id onto every
 * line, so the audit trail, the cockpit reasons, and the metrics share one trace.
 */
import { randomUUID } from 'node:crypto';
import { pino, type Logger } from 'pino';

export type { Logger };

/** The log levels the system uses, matching the config enum. */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Create the root logger for a service.
 *
 * @param service - the service name, added to every line as `service`.
 * @param level - the minimum level to emit (defaults to info).
 */
export function createLogger(service: string, level: LogLevel = 'info'): Logger {
  return pino({
    level,
    base: { service },
    timestamp: pino.stdTimeFunctions.isoTime,
  });
}

/**
 * Derive a child logger bound to a single claim. Every line it emits carries the
 * correlation id, which is how one claim is traced across services.
 */
export function withCorrelation(logger: Logger, correlationId: string): Logger {
  return logger.child({ correlationId });
}

/** Generate a fresh correlation id for a new claim. */
export function newCorrelationId(): string {
  return randomUUID();
}
