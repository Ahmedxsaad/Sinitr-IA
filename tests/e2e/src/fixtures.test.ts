/**
 * Fixture manifest validator (see improvements P2.8). Walks `data/manifest.json`
 * and proves every listed claim, policy, graph seed, and media reference still
 * matches its contract schema. A stale or hand-edited fixture fails here instead
 * of surfacing as a confusing failure deep in the pipeline or, worse, on stage.
 */
import { describe, expect, it } from 'vitest';
import {
  createClaimRequestSchema,
  damageSeveritySchema,
  fixtureManifestSchema,
  graphSeedFixtureSchema,
  impactAreaSchema,
  policyFixtureSchema,
} from '@sinistria/contracts';
import { parseSeedRef } from '@sinistria/evidence/seed-ref';
import manifest from '../../../data/manifest.json';
import honestClaim from '../../../data/claims/honest.json';
import suspiciousClaim from '../../../data/claims/suspicious.json';
import policyFixture from '../../../data/policies/motor-standard.json';
import graphSeed from '../../../data/graph/seed.json';

// Maps a manifest claim id to the fixture module already imported above.
// Reading files dynamically from disk would need Node's fs module inside a
// bundled test; importing each fixture directly keeps the check type-safe and
// keeps the manifest as the single list of what should exist.
const CLAIM_FIXTURES: Record<string, unknown> = {
  honest: honestClaim,
  suspicious: suspiciousClaim,
};

const POLICY_FIXTURES: Record<string, unknown> = {
  'data/policies/motor-standard.json': policyFixture,
};

const GRAPH_FIXTURES: Record<string, unknown> = {
  'data/graph/seed.json': graphSeed,
};

describe('fixture manifest', () => {
  const parsedManifest = fixtureManifestSchema.parse(manifest);

  it('lists a fixture module for every claim entry', () => {
    for (const entry of parsedManifest.claims) {
      expect(CLAIM_FIXTURES[entry.id], `no fixture wired for claim "${entry.id}"`).toBeDefined();
    }
  });

  it('every manifest claim parses as a valid create-claim request', () => {
    for (const entry of parsedManifest.claims) {
      const result = createClaimRequestSchema.safeParse(CLAIM_FIXTURES[entry.id]);
      expect(result.success, `claim "${entry.id}" failed schema validation`).toBe(true);
    }
  });

  it('every manifest policy parses and has at least one coverage clause', () => {
    for (const entry of parsedManifest.policies) {
      const result = policyFixtureSchema.safeParse(POLICY_FIXTURES[entry.path]);
      expect(result.success, `policy at "${entry.path}" failed schema validation`).toBe(true);
      if (result.success) {
        expect(result.data.policyId).toBe(entry.policyId);
        expect(result.data.clauses.some((clause) => clause.kind === 'coverage')).toBe(true);
      }
    }
  });

  it('every manifest graph seed parses as a valid graph fixture', () => {
    for (const entry of parsedManifest.graph) {
      const result = graphSeedFixtureSchema.safeParse(GRAPH_FIXTURES[entry.path]);
      expect(result.success, `graph seed at "${entry.path}" failed schema validation`).toBe(true);
    }
  });

  it('every manifest media ref is well-formed and, for vision refs, uses valid enum values', () => {
    for (const entry of parsedManifest.media) {
      const parsed = parseSeedRef(entry.ref);
      expect(parsed, `media ref "${entry.ref}" is not a valid seed ref`).not.toBeNull();
      expect(parsed?.kind).toBe(entry.kind);
      if (parsed && parsed.kind === 'vision') {
        expect(
          impactAreaSchema.safeParse(parsed.a).success,
          `"${entry.ref}" has an invalid area`,
        ).toBe(true);
        expect(
          damageSeveritySchema.safeParse(parsed.b).success,
          `"${entry.ref}" has an invalid severity`,
        ).toBe(true);
      }
    }
  });

  it('every media ref used by a claim fixture is registered in the manifest', () => {
    const registeredRefs = new Set(parsedManifest.media.map((entry) => entry.ref));
    for (const [id, fixture] of Object.entries(CLAIM_FIXTURES)) {
      const claim = createClaimRequestSchema.parse(fixture);
      for (const ref of claim.mediaRefs) {
        expect(registeredRefs.has(ref), `claim "${id}" uses unregistered media ref "${ref}"`).toBe(
          true,
        );
      }
    }
  });
});
