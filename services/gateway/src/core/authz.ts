/**
 * Adjuster-route authorization, shared by every route that exposes claim data
 * to the cockpit. Demo mode stays open for the scripted walkthrough; otherwise
 * a bearer token is required (see D-0010).
 */
import { getConfig } from '@sinistria/config';
import type { FastifyRequest } from 'fastify';

export function isAuthorizedAdjuster(request: FastifyRequest): boolean {
  const config = getConfig();
  if (config.DEMO_MODE) return true;
  const authorization = request.headers.authorization;
  return authorization === `Bearer ${config.ADJUSTER_TOKEN}`;
}
