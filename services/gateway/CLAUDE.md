# services/gateway - API gateway and backend-for-frontend

Part of Sinistr'IA. Read the root [../../CLAUDE.md](../../CLAUDE.md) for global
rules. This file adds only what is specific to the gateway.

Owner workstream: Integration.
Purpose: the single entry point for both frontends.

## Responsibilities

- Route frontend requests to the correct internal service.
- Role-based access: customer versus adjuster.
- Aggregate responses where a frontend view needs several services.
- Attach and propagate the claim correlation id (see improvements P1.2).
- Rate limiting and basic request validation.

## Boundaries (do not)

- Hold no business logic. Routing and aggregation only.
- Do not transform domain data beyond shaping a response for a frontend.

## Depends on

- All internal services over HTTP.
- `packages/contracts`, `packages/config`, `packages/logger`.

## Local notes

- The only service exposed to the public network. Internal services are not.

## Changelog

- 2026-07-18 00:47 CET - @Ahmedxsaad - Created part
  skeleton and guidance.
- 2026-07-18 02:13 CET - @Ahmedxsaad - Implemented the claim pipeline, in-memory store, decision handling, and public API.
- 2026-07-18 03:24 CET - Codex - Added non-demo bearer-token protection for adjuster queue, detail, and decision routes.
