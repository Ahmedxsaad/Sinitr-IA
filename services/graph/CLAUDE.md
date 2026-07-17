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

- 2026-07-18 00:47 CET - Claude (Opus 4.8) for @Ahmedxsaad - Created part
  skeleton and guidance.
