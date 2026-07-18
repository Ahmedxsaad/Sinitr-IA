# services/notify - SMS and status updates

Part of Sinistr'IA. Read the root [../../CLAUDE.md](../../CLAUDE.md) for global
rules. This file adds only what is specific to notify.

Owner workstream: Integration.
Purpose: tell the customer what happened after the adjuster acts.

## Responsibilities

- Send an SMS or status update once the adjuster approves or routes a claim.
- Use approved, neutral message templates.
- Record every send in the audit trail with the claim correlation id.

## Boundaries (do not)

- Never send a message that promises a payout or implies an automatic decision.
- Do not trigger on model output alone. Only a human-approved action sends a
  message.

## Depends on

- Hosted SMS provider, with an offline fallback for the demo.
- `packages/contracts`, `packages/config`, `packages/logger`.

## Local notes

- Test the SMS destination and sender before the demo. Keep an offline fallback
  that shows the status in the UI when the provider is unreachable.

## Changelog

- 2026-07-18 00:47 CET - @Ahmedxsaad - Created part
  skeleton and guidance.
- 2026-07-18 02:13 CET - @Ahmedxsaad - Implemented the SMS mock and notification sending.
