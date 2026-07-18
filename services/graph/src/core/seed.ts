/**
 * The seeded relationship graph. Kept local and deterministic so the fraud-
 * network reveal in the demo never depends on a live external service. A real
 * deployment would replace this with a query against the insurer's claims graph.
 */

export interface SeedGraph {
  /** Garage phone numbers that already appear across earlier claims. */
  knownGaragePhones: Record<string, string>; // phone -> prior claim id
  /** Media references that already appeared in earlier claims (reused images). */
  knownReusedImages: Record<string, string>; // media ref -> prior claim id
}

export const SEED_GRAPH: SeedGraph = {
  knownGaragePhones: {
    '+21620000009': 'CLM-2026-000188',
  },
  knownReusedImages: {
    'seed:suspicious:vision:front_right:moderate': 'CLM-2026-000188',
  },
};
