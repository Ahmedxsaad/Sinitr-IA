/**
 * Anomaly detection over the seeded relationship graph. Every flag describes an
 * evidence pattern (a reused image, a shared garage phone), never a person, and
 * recommends investigation rather than any accusation.
 */
import type { AnomalyFlag, GraphRequest } from '@sinistria/contracts';
import { SEED_GRAPH } from './seed.js';

/** Detect anomalies for a claim against the seeded graph. */
export function detectAnomalies(request: GraphRequest): AnomalyFlag[] {
  const flags: AnomalyFlag[] = [];

  // A garage phone number that already appears in an earlier claim.
  if (request.garagePhone) {
    const priorClaim = SEED_GRAPH.knownGaragePhones[request.garagePhone];
    if (priorClaim) {
      flags.push({
        type: 'shared_garage_phone',
        description: 'The garage phone number also appears in an earlier claim.',
        severity: 'high',
        relatedClaimId: priorClaim,
      });
    }
  }

  // An uploaded image that already appeared in an earlier claim.
  for (const ref of request.mediaRefs) {
    const priorClaim = SEED_GRAPH.knownReusedImages[ref];
    if (priorClaim) {
      flags.push({
        type: 'reused_image',
        description: 'An uploaded image matches one submitted in an earlier claim.',
        severity: 'high',
        relatedClaimId: priorClaim,
      });
    }
  }

  return flags;
}
