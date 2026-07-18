/**
 * Schemas for the seeded fixture files under `data/`. They live in contracts so
 * the service that loads a fixture and the test that validates it parse the
 * exact same shape, which keeps the dataset and the runtime from drifting.
 */
import { z } from 'zod';
import { claimRouteSchema, claimStateSchema } from './enums.js';
import { policyClauseSchema } from './twin.js';

/**
 * A policy example in `data/policies`: the policy id plus its explicit clauses.
 * Coverage grounding selects clauses by their `kind`, so a usable policy needs
 * at least one coverage clause.
 */
export const policyFixtureSchema = z.object({
  policyId: z.string().min(1),
  clauses: z.array(policyClauseSchema).min(1),
});
export type PolicyFixture = z.infer<typeof policyFixtureSchema>;

/**
 * The seeded relationship graph in `data/graph`. Both maps go from an observed
 * value (a garage phone, a media reference) to the prior claim id it already
 * appeared in.
 */
export const graphSeedFixtureSchema = z.object({
  knownGaragePhones: z.record(z.string()),
  knownReusedImages: z.record(z.string()),
});
export type GraphSeedFixture = z.infer<typeof graphSeedFixtureSchema>;

/**
 * One entry in the fixture manifest (`data/manifest.json`): a claim, a policy,
 * the graph seed, or a media seed ref, with the path or ref and a short
 * description. The manifest is the checklist a validator walks to prove every
 * fixture on disk still matches its contract schema (see improvements P2.8).
 */
export const fixtureManifestSchema = z.object({
  claims: z
    .array(
      z.object({
        id: z.string().min(1),
        path: z.string().min(1),
        description: z.string().min(1),
        // The state and route the pipeline must produce for this claim. Pinning
        // both here, not just in a golden Twin, lets the validator prove every
        // fixture in the dataset behaves as documented, not only the two hero
        // cases that get a full golden comparison.
        expectedState: claimStateSchema,
        expectedRoute: claimRouteSchema,
      }),
    )
    .min(1),
  policies: z
    .array(
      z.object({
        policyId: z.string().min(1),
        path: z.string().min(1),
      }),
    )
    .min(1),
  graph: z
    .array(
      z.object({
        path: z.string().min(1),
      }),
    )
    .min(1),
  media: z
    .array(
      z.object({
        ref: z.string().min(1),
        kind: z.enum(['vision', 'doc']),
        description: z.string().min(1),
      }),
    )
    .min(1),
});
export type FixtureManifest = z.infer<typeof fixtureManifestSchema>;
