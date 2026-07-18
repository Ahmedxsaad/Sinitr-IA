# Sinistr'IA - Decision log

One entry per non-obvious choice. Newest at the bottom. Keep entries short. See
the format note in [conventions.md](conventions.md).

Template:

```text
## D-XXXX - Title
- Date:
- Context:
- Options:
- Decision:
- Reason:
- Result:
```

---

## D-0001 - Repository shape: microservices monorepo

- Date: 2026-07-18
- Context: Four contributors need to work in parallel with minimal collision,
  and the product has distinct surfaces (customer journey, adjuster cockpit) and
  distinct intelligence concerns (intake, evidence, claims, graph, notify).
- Options: (a) single monolith app, (b) microservices in one monorepo with
  shared packages, (c) many separate repositories.
- Decision: Microservices in one pnpm-workspaces monorepo.
- Reason: Independent, clearly owned services map to the four workstreams, while
  a single repo keeps one toolchain and a shared contract package. Separate
  repos would add coordination cost during a 72-hour build.
- Result: Structure created. Confirmed as the working shape.

## D-0002 - Language: TypeScript across frontends and services

- Date: 2026-07-18
- Context: The intelligence layer relies on hosted speech, vision, and language
  APIs rather than local model training, so any language can call them over
  HTTP. The Accident Evidence Twin is the central shared object.
- Options: (a) all TypeScript, (b) Python backend services plus TypeScript
  frontends, (c) polyglot per service.
- Decision: TypeScript everywhere for the initial build.
- Reason: One toolchain for four people, and a single shared Twin contract
  (Zod) imported by every service and both frontends. This removes the
  cross-language type-generation burden on the most important object. Python
  stays available later per service because services are decoupled behind HTTP.
- Result: Adopted. Revisit only if a specific service needs a Python-only
  library.

## D-0003 - Governance files: CLAUDE.md with AGENT.md symlink per part

- Date: 2026-07-18
- Context: The team uses AI agents and wants consistent rules without
  duplication, across tools that read either `CLAUDE.md` or `AGENT.md`.
- Options: (a) one root file only, (b) separate CLAUDE.md and AGENT.md with
  duplicated content, (c) CLAUDE.md per part plus an AGENT.md symlink to it.
- Decision: One `CLAUDE.md` per part, with `AGENT.md` as a symlink to it. The
  root file holds global rules; per-part files hold only local specifics.
- Reason: Single source of truth per part, no duplication, and both filenames
  resolve to the same content. Keeps context small.
- Result: Applied to the root and to each app, each service, and the contracts
  package. Note: symlinks need `git config core.symlinks true` on Windows
  checkouts; the team is on Linux and macOS.

## D-0004 - Add a shared service-kit package

- Date: 2026-07-18
- Context: Six Fastify services each need the same bootstrap (health endpoint,
  correlation id, error handling, graceful shutdown), and duplicating it would
  drift.
- Options: (a) copy the setup into each service, (b) a shared `service-kit`
  package.
- Decision: A shared `packages/service-kit` used by every service.
- Reason: One place for cross-cutting concerns keeps each service focused on its
  own domain and keeps the setup consistent.
- Result: Adopted. `createServer` and `start` back all six services.

## D-0005 - Test the pipeline in-process via service core exports

- Date: 2026-07-18
- Context: The vertical slice must be provably end-to-end without the flakiness of
  starting six processes inside the test runner.
- Options: (a) integration test that boots all services over HTTP, (b) an
  in-process test that drives the gateway pipeline against each service's core.
- Decision: Each service exposes its pure core through a `./core` package export,
  and the `tests/e2e` package wires those into the gateway's ServiceClients.
- Reason: The gateway pipeline depends only on the ServiceClients interface, so
  the same orchestration is exercised in-process, deterministically and fast. The
  live HTTP path is covered separately by `scripts/smoke.sh`.
- Result: Two demo cases pass in-process; the smoke script passes over HTTP.

## D-0006 - Frontends proxy the gateway via Next rewrites

- Date: 2026-07-18
- Context: The browser apps must call the gateway, which runs on a different port.
- Options: (a) enable CORS on the gateway, (b) proxy `/api/*` from each app to
  the gateway with a Next.js rewrite.
- Decision: Next rewrites, so the browser makes same-origin calls.
- Reason: No CORS surface to secure, the gateway URL stays server-side, and the
  frontends stay simple.
- Result: Both apps call `/api/*` and reach the gateway with no CORS config.

## D-0007 - In-memory claim store for the slice

- Date: 2026-07-18
- Context: The gateway must hold a claim between submission and the adjuster
  decision, but a database is out of scope for the first slice.
- Options: (a) add a database now, (b) an in-memory store with a clear interface.
- Decision: An in-memory `ClaimStore` in the gateway, with the contact phone kept
  out of the Twin (data minimization).
- Reason: It proves the flow without infrastructure and has a clean seam to
  replace with persistence later.
- Result: In use. Claims survive submit, review, and approval within one process.

## D-0008 - Boundary hardening for confirmation, limits, and failures

- Date: 2026-07-18
- Context: The audit found that unconfirmed reports entered the pipeline, large
  payloads had no application-level bounds, and unexpected HTTP errors exposed
  their internal messages.
- Options: (a) rely on the browser and Fastify defaults, (b) enforce the rules
  in shared Zod schemas and sanitize server errors, (c) add a separate validation
  service.
- Decision: Enforce confirmation and bounded payloads in `packages/contracts`,
  use neutral boundary errors in `packages/service-kit`, and keep the rules
  deterministic in each service.
- Reason: The shared contract is the earliest common boundary, and the change
  prevents malformed or unapproved data from reaching business logic without
  adding another runtime dependency.
- Result: The contract tests cover rejection cases, and the full suite and live
  smoke path pass.

## D-0009 - Pin patched PostCSS in the workspace

- Date: 2026-07-18
- Context: `pnpm audit --prod` identified a moderate PostCSS XSS advisory through
  Next.js in the cockpit application.
- Options: (a) accept the transitive version, (b) add a workspace override to the
  patched compatible release, (c) replace Next.js.
- Decision: Pin PostCSS to the patched 8.5.19 line with a pnpm override.
- Reason: It is a compatible transitive update with no application API change;
  replacing the framework would add unnecessary risk.
- Result: The lockfile no longer contains PostCSS 8.4.31 and the production
  audit reports no known vulnerabilities.

## D-0010 - Guard adjuster routes outside demo mode

- Date: 2026-07-18
- Context: The audit found that any caller could read the adjuster queue and
  submit a decision. A full identity-provider integration is not part of the
  offline slice.
- Options: (a) leave all routes open, (b) add a deployment bearer-token guard,
  (c) build a complete identity and role service now.
- Decision: Require `Authorization: Bearer <ADJUSTER_TOKEN>` for adjuster queue,
  detail, and decision routes whenever `DEMO_MODE=false`; keep the demo open for
  the scripted walkthrough.
- Reason: This closes accidental unauthenticated access in non-demo deployments
  with a small reversible boundary control while leaving the identity-provider
  seam explicit.
- Result: Configuration validation requires a token outside demo mode, and the
  remaining work is documented for production identity integration.
