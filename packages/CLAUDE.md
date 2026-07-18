# packages - Shared libraries

Part of Sinistr'IA. Read the root [../CLAUDE.md](../CLAUDE.md) for global rules.
This file covers rules shared by every package under `packages/`.

Purpose: reusable libraries imported by apps and services. No package owns a
running process.

## Packages

- `contracts` - Accident Evidence Twin schema, DTOs, event types. The single
  source of truth. Has its own CLAUDE.md.
- `config` - typed environment parsing and validation, shared constants, thresholds.
- `logger` - structured logging and request context (carries the correlation id).
- `service-kit` - the shared Fastify bootstrap (health, correlation id, shutdown).
- `ui` - shared React components and design tokens for both frontends.

## Rules

- No side effects on import. A package exposes functions, types, and components,
  and does nothing at load time.
- Stable public surface. Export a clear index. Do not leak internal files.
- No environment reads outside `config`. Other packages receive config, they do
  not fetch it.
- Backward compatibility. A change here ripples everywhere, so keep changes
  additive where possible and note breaking ones in the decision log.

## Changelog

- 2026-07-18 00:47 CET - @Ahmedxsaad - Created shared
  package guidance.
- 2026-07-18 02:13 CET - @Ahmedxsaad - Added service-kit to the shared packages and listed it here.
