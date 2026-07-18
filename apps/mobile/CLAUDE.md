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
- 2026-07-18 03:24 CET - Codex - Exposed the suspicious demo path and forwarded optional garage evidence to graph analysis.
- 2026-07-18 16:20 CET - Claude - Adopted `@sinistria/ui`'s `RouteBadge` and `ConfidenceBadge`. Fixes the demo result always showing the route in green regardless of the actual route, and adds a confidence badge that was previously missing entirely (D-0018).
- 2026-07-18 17:05 CET - Claude - Added a language switcher (Derja, Français, العربية) so Arabic is reachable at all; selecting it sets `dir="rtl"` and `lang="ar"`. The two toggle-button groups now use `role="group"` and `aria-labelledby` instead of a floating, unassociated `<label>`, and every interactive element has a visible `:focus-visible` style (D-0019, B-7).
- 2026-07-18 18:10 CET - Claude - Redesigned to the shared dark cinematic language: aurora gradient backdrop, glass cards, a glowing mic hero, `next/font` typography, and staggered entrance motion (D-0020).
