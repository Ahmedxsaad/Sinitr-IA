# packages/contracts - The shared contract

Part of Sinistr'IA. Read the root [../../CLAUDE.md](../../CLAUDE.md) and the
packages guidance [../CLAUDE.md](../CLAUDE.md). This file adds what is specific
to contracts.

Owner workstream: Shared, all workstreams.
Purpose: define the Accident Evidence Twin and every cross-service payload once,
so nothing is redefined elsewhere.

## What lives here

- The Accident Evidence Twin schema (Zod), with types inferred from the schema.
  - Structured facts, event timeline, damage evidence, coverage evidence,
    consistency evidence, confidence and provenance.
- Enums: route (fast-track, review, investigate), confidence label (high,
  medium, low), and the claim state machine values.
- Request and response DTOs for every service boundary.
- Service event types that carry the claim correlation id.

## Rules

- Single source of truth. No service or app redefines any of these types.
- Schema first. Define the Zod schema, then infer the TypeScript type from it.
  Never hand-write a type that duplicates a schema.
- Every field that comes from a model carries provenance and a confidence label.
  Do not add a field that cannot state where it came from.
- Changes here are breaking by default. Coordinate, and add a decision-log entry
  for any change to the Twin shape.

## Boundaries (do not)

- No runtime logic beyond schema definitions and validation helpers.
- No environment reads, no I/O, no side effects on import.

## Changelog

- 2026-07-18 00:47 CET - @Ahmedxsaad - Created contract
  package guidance.
- 2026-07-18 02:13 CET - @Ahmedxsaad - Implemented the Evidence Twin schema, enums, primitives, DTOs, and state machine.
- 2026-07-18 03:24 CET - Codex - Required confirmed submissions and bounded external payload fields, with rejection tests.
- 2026-07-18 12:47 CET - Claude - Added `fixtures.ts`: schemas for the `data/` fixture files (policy, graph seed, and the fixture manifest), so the fixtures on disk and the services that load them share one shape (D-0011, D-0012).
- 2026-07-18 13:10 CET - Claude - Added `expectedState` and `expectedRoute` to the manifest claim entry schema, so the dataset's documented outcomes are data the validator checks, not prose (D-0013).
