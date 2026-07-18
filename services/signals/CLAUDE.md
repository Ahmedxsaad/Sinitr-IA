# services/signals - Situational-awareness feed

Part of Sinistr'IA. Read the root [../../CLAUDE.md](../../CLAUDE.md) for global
rules. This file adds only what is specific to signals.

Owner workstream: Integration.
Purpose: give the adjuster optional regional context (floods, road incidents,
outbreaks) while reviewing claims. Additive and standalone.

## Responsibilities

- Fetch a regional news feed (offline seeded fixtures in demo mode, live RSS
  outside it) behind a provider-agnostic adapter.
- Classify each item into a signal event with a criticality label, the motor
  concerns it touches, and a neutral one-line assessment.
- Serve the classified, ordered events over HTTP for the cockpit.

## Boundaries (do not)

- Not part of the claim pipeline. Never read or write an Accident Evidence Twin,
  and never call another domain service. Per-claim corroboration is a future,
  separate decision.
- Criticality is a label, never a naked numeric score. Describe events
  neutrally; never speculate about a "business opportunity" or name a person.
- Keep classification deterministic and explainable (rules where safer). A live
  model may be added behind the same function shape, but the rules stay the
  offline default so the demo never depends on a model call.

## Depends on

- Seed data in `data/signals`.
- `packages/contracts`, `packages/config`, `packages/logger`,
  `packages/service-kit`.

## Local notes

- Port 4006. Reached by the gateway's additive `GET /api/signals` read-through,
  which keeps the gateway the only entry point for the cockpit.

## Changelog

- 2026-07-18 - Claude - Created the standalone signals service: mock feed
  adapter over seeded fixtures, deterministic rules classifier, and the
  `/signals` route (D-0018).
