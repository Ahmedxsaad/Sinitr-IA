# services/claims - Claims logic

Part of Sinistr'IA. Read the root [../../CLAUDE.md](../../CLAUDE.md) for global
rules. This file adds only what is specific to claims.

Owner workstream: Claims logic.
Purpose: ground the claim in policy, apply trust gates, and recommend a route.

## Responsibilities

- Policy-grounded retrieval of coverage clauses and exclusions.
- Trust gates: injury or safety, disputed liability, low confidence, potential
  hidden damage, contradictory evidence, high value or unusual pattern.
- Recommendation with a route (fast-track, review, investigate), the reasons,
  and a confidence label.
- Draft the customer communication for the adjuster to approve.

## Boundaries (do not)

- No autonomous payout. A human approves before any financial decision.
- Every recommendation must cite its evidence and the exact policy clause.
- Keep the trust gates deterministic and explainable. Rules where safer.

## Depends on

- Policy and guarantee data in `data/policies`.
- `services/graph` anomaly flags.
- `packages/contracts`, `packages/config`, `packages/logger`.

## Local notes

- The trust-gate module is the credibility centerpiece. Keep it pure and unit
  tested (see improvements P2.5).

## Changelog

- 2026-07-18 00:47 CET - @Ahmedxsaad - Created part
  skeleton and guidance.
- 2026-07-18 02:13 CET - @Ahmedxsaad - Implemented policy grounding, trust gates, and the routed recommendation.
- 2026-07-18 03:24 CET - Codex - Corrected coverage and investigation explanations and added focused recommendation tests.
- 2026-07-18 12:47 CET - Claude - Moved the seed policy from an inline constant into `data/policies/motor-standard.json`, loaded and schema-validated at import time (D-0011).
