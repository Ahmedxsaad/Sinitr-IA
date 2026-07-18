# apps/mobile - Customer Derja journey

Part of Sinistr'IA. Read the root [../../CLAUDE.md](../../CLAUDE.md) for global
rules. This file adds only what is specific to the mobile app.

Owner workstream: Mobile and live journey.
Purpose: the calm, guided mobile web journey the driver uses at the roadside.

## Responsibilities

- Safety first: the first question is about injuries and immediate danger.
- One instruction at a time. No long forms, no insurance jargon.
- Derja voice intake with a frictionless French fallback.
- Guided capture prompts (angle, blur, completeness) and visible progress.
- Confirm extracted facts and let the user correct them before submission.

## Boundaries (do not)

- No business logic. No routing, recommendation, or coverage decisions here.
- Talk only to `services/gateway`, never to other services directly.
- Never accuse the customer of fraud. Route concerns to the cockpit.

## Depends on

- `services/gateway` over HTTP.
- `packages/contracts` for payload types.
- `packages/ui` for shared components and design tokens.

## Local notes

- Entry by link or QR. Mobile web, no native app.
- Commands are added when the app is scaffolded.

## Changelog

- 2026-07-18 00:47 CET - @Ahmedxsaad - Created part
  skeleton and guidance.
- 2026-07-18 02:13 CET - @Ahmedxsaad - Built the guided Derja report journey with the demo case and completeness meter.
