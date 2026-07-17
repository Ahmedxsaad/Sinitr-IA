# services/evidence - Multimodal intelligence

Part of Sinistr'IA. Read the root [../../CLAUDE.md](../../CLAUDE.md) for global
rules. This file adds only what is specific to evidence.

Owner workstream: Multimodal intelligence.
Purpose: improve the inputs, then assemble the Accident Evidence Twin.

## Responsibilities

- Guided-capture checks: blur, missing angle, incomplete context, and the
  next-best prompt for the driver.
- Image quality and damage localization with a visible-damage severity range.
- OCR and document structuring for constat and invoices.
- Cross-modal consistency: story versus image versus document.
- Assemble the Twin per the `packages/contracts` schema, with provenance and a
  confidence label on every field.

## Boundaries (do not)

- Produce evidence and confidence, never a payout or a final route.
- Do not overclaim. Uncertainty must lower confidence and can trigger
  escalation downstream.
- Validate every model output against the contract schema before trusting it.

## Depends on

- Hosted vision or multimodal API and an OCR API.
- `packages/contracts`, `packages/config`, `packages/logger`.

## Local notes

- The Twin is the demo canvas. Correctness here drives the whole cockpit view.

## Changelog

- 2026-07-18 00:47 CET - Claude (Opus 4.8) for @Ahmedxsaad - Created part
  skeleton and guidance.
