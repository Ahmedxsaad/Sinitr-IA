# services/graph - Relationship graph and anomaly flags

Part of Sinistr'IA. Read the root [../../CLAUDE.md](../../CLAUDE.md) for global
rules. This file adds only what is specific to graph.

Owner workstream: Multimodal intelligence.
Purpose: surface relationships and anomalies behind a suspicious claim.

## Responsibilities

- Maintain a seeded relationship graph over claims, vehicles, phone numbers, and
  garages.
- Emit anomaly flags: reused image, shared garage phone across prior cases,
  invoice category mismatch, and similar signals.
- Provide the graph view data the cockpit renders for the suspicious case.

## Boundaries (do not)

- Flag evidence inconsistencies, never accuse a person. Neutral language only.
- Recommend investigation, never automatic rejection.
- Seed all graph data locally. Never depend on live external services for the
  demo graph.

## Depends on

- Seed data in `data/graph`.
- `packages/contracts`, `packages/config`, `packages/logger`.

## Local notes

- The graph reveal is a one-click demo beat. Keep timing tight and data seeded.

## Changelog

- 2026-07-18 00:47 CET - @Ahmedxsaad - Created part
  skeleton and guidance.
- 2026-07-18 02:13 CET - @Ahmedxsaad - Implemented the seeded relationship graph and anomaly detection.
- 2026-07-18 12:47 CET - Claude - Moved the seed graph from an inline constant into `data/graph/seed.json`, loaded and schema-validated at import time (D-0011).
- 2026-07-18 14:10 CET - Claude - Added `buildGraphView`, a pure function that turns the detected anomalies into the cockpit's relationship-graph view (nodes and edges), returned alongside the anomaly flags (D-0015).
