# services/intake - Voice and text intake

Part of Sinistr'IA. Read the root [../../CLAUDE.md](../../CLAUDE.md) for global
rules. This file adds only what is specific to intake.

Owner workstream: Voice and intake.
Purpose: turn roadside Derja or French speech into structured FNOL fields, and
run the first safety and eligibility gates.

## Responsibilities

- Orchestrate hosted speech to text for Derja with a French fallback.
- Structure FNOL fields: actors, vehicles, time, location, collision direction.
- Safety gate: injury or danger routes the case away from automation.
- Eligibility gate: property-damage-only with clear coverage stays in scope.
- Show the structured interpretation so the customer can confirm or correct it.

## Boundaries (do not)

- Do not make routing or recommendation decisions. That is `services/claims`.
- Do not build the full Twin. That is `services/evidence`.
- Low transcription confidence must be explicit, never hidden.

## Depends on

- Hosted speech to text API.
- `packages/contracts`, `packages/config`, `packages/logger`.

## Local notes

- Test Derja quality first. Keep the French and typed-correction paths ready.

## Changelog

- 2026-07-18 00:47 CET - @Ahmedxsaad - Created part
  skeleton and guidance.
- 2026-07-18 02:13 CET - @Ahmedxsaad - Implemented the speech mock, FNOL structuring, and the safety and eligibility gates.
- 2026-07-18 03:24 CET - Codex - Hardened complexity matching with word boundaries and added regression coverage for false positives.
