# apps/cockpit - Adjuster cockpit

Part of Sinistr'IA. Read the root [../../CLAUDE.md](../../CLAUDE.md) for global
rules. This file adds only what is specific to the cockpit app.

Owner workstream: Cockpit and visual story.
Purpose: where the adjuster reviews the Accident Evidence Twin and owns the
decision.

## Responsibilities

- Render the Twin in a decision, why, proof hierarchy.
  - Top: recommended route, confidence, urgency, and the human action.
  - Middle: coverage clause, completeness, consistency, and risk signals.
  - Bottom: voice excerpt, image region, and editable source field.
- Every output links back to its source (voice segment, image region, clause).
- Approve, ask for clarification, or open an investigation. The human decides.
- Show the relationship graph and anomaly flags for suspicious cases.

## Boundaries (do not)

- Never present a naked score. Always pair it with evidence and a reason.
- Talk only to `services/gateway`, never to other services directly.
- Do not auto-approve. A financial decision requires a human action.

## Depends on

- `services/gateway` over HTTP.
- `packages/contracts` for the Twin type.
- `packages/ui` for shared components and design tokens.

## Local notes

- Animations are fast and functional, not decorative.
- Commands are added when the app is scaffolded.

## Changelog

- 2026-07-18 00:47 CET - @Ahmedxsaad - Created part
  skeleton and guidance.
- 2026-07-18 02:13 CET - @Ahmedxsaad - Built the adjuster cockpit: queue, Evidence Twin review, and approve action.
- 2026-07-18 13:20 CET - Claude - Added a live metrics strip (claims processed, average time to FNOL, average evidence completeness, route breakdown) above the queue table (D-0014).
- 2026-07-18 14:10 CET - Claude - Added the relationship-graph reveal: a one-click inline-SVG panel on the claim detail page, shown when the claim has anomalies (D-0015).
- 2026-07-18 16:20 CET - Claude - Adopted `@sinistria/ui`'s `RouteBadge` and `ConfidenceBadge` in the queue table and claim detail page, replacing the app-local route pill and the previously plain-text confidence label (D-0018).
