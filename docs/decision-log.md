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

## D-0011 - Seed data moves from inline constants to validated `data/` fixtures

- Date: 2026-07-18
- Context: The seeded policy (in `services/claims`) and the seeded relationship
  graph (in `services/graph`) lived as inline TypeScript constants, so
  `data/policies` and `data/graph` stayed empty even though the architecture
  names them as the home for this data (see improvements P2.8).
- Options: (a) leave the seeds inline in each service, (b) move them to JSON
  fixtures under `data/`, loaded and validated at import time against new
  contract schemas, (c) introduce a database for seed data now.
- Decision: JSON fixtures under `data/policies` and `data/graph`, loaded through
  new `policyFixtureSchema` and `graphSeedFixtureSchema` in
  `packages/contracts`, parsed once at module load so a malformed edit fails
  immediately rather than silently disabling coverage grounding or anomaly
  detection.
- Reason: Matches the architecture's stated data layout, keeps the seed content
  reviewable as data instead of code, and the schema-validated load closes the
  "trust hosted output at the boundary" gap for hand-edited fixtures too. A
  database is out of scope for the offline demo slice.
- Result: `groundCoverage` and the graph seed both read from `data/`. All
  existing tests pass unchanged because the public function signatures did not
  change.

## D-0012 - Fixture manifest and golden Twin fixtures

- Date: 2026-07-18
- Context: Two P1/P2 improvements were still open: golden-file tests for the
  two hero cases (P1.3) and a fixture manifest with a validator (P2.8). Day-3
  hardening is where demos break, and a stale fixture should fail fast and
  close to the change, not during a live run.
- Options: (a) skip both and rely on the existing pipeline test's loose
  assertions, (b) add golden fixtures only, (c) add both a fixture manifest
  with a schema-validated checklist and golden Twin fixtures compared with
  timestamps normalized.
- Decision: (c). `data/manifest.json` lists every claim, policy, graph seed,
  and media seed ref, validated by a new `fixtureManifestSchema`.
  `tests/e2e/src/fixtures.test.ts` checks every manifest entry against its
  contract schema and cross-checks that every media ref a claim fixture uses is
  registered. `data/claims/{honest,suspicious}.expected-twin.json` hold the
  full Accident Evidence Twin for each hero case (timestamps normalized to a
  placeholder); `tests/e2e/src/golden.test.ts` reproduces each Twin from the
  real pipeline and asserts equality.
- Reason: The manifest is the single checklist a reviewer or a script can walk;
  the golden Twins are the strongest regression guard available without a live
  demo run, since they pin every field, not just the handful the original
  pipeline test asserted on. Evidence's seed-ref parser gained a `./seed-ref`
  export so the validator can check media refs without duplicating the format.
- Result: 8 new tests pass (6 manifest, 2 golden), full verification
  (typecheck, lint, format, 121 tests, both app builds, the live smoke script,
  and `pnpm audit --prod`) is clean.

## D-0013 - Expand the demo dataset to ten claims, with outcomes asserted from data

- Date: 2026-07-18
- Context: The dataset had only the two hero cases. The backlog (B-1) called
  for broader coverage of the gates, the completeness scoring, the consistency
  checks, and the coverage exclusion, both to stress-test the rules before the
  demo and to give the mobile and cockpit UI more than two claims to show.
- Options: (a) add more claims but only check they parse against the schema,
  same as before, (b) add more claims and hand-write a dedicated assertion per
  claim in a test file, (c) add `expectedState` and `expectedRoute` fields to
  each manifest claim entry and have one generic test run every claim through
  the real pipeline and assert against those fields.
- Decision: (c). `fixtureManifestSchema`'s claim entries now carry
  `expectedState` and `expectedRoute`. Eight new claims were added: `injury`
  and `fire` and `rollover` exercise the safety and eligibility gates
  (escalated, review); `sparse` exercises the low-completeness path down to a
  low-confidence review; `no-invoice` exercises the fast-track completeness
  floor (85 percent, just under the 90 percent minimum); `severe` exercises the
  hidden-damage exclusion and the potential-hidden-damage escalation reason;
  `honest-fr` is a French-language fast-track twin of the honest case;
  `invoice-mismatch` exercises the invoice-versus-damage contradiction check in
  isolation. Every expected value was derived by hand from the trust-gate,
  scoring, and recommendation logic, then confirmed against one real pipeline
  run before being written into the fixture.
- Reason: A generic outcome test scales to any number of future claims without
  new test code, and pinning the expectation in the manifest (data) rather than
  in test code (logic) keeps the manifest the single source of what the
  dataset is supposed to prove, matching the pattern already set for schema
  validation.
- Result: `tests/e2e/src/fixtures.test.ts` gained one test that runs all ten
  claims through the in-process pipeline and asserts state and route. Full
  verification (typecheck, lint, format, 122 tests, both app builds, the live
  smoke script) is clean.

## D-0014 - Live metrics computed on read, not emitted as stored events

- Date: 2026-07-18
- Context: The backlog (B-2) called for live metrics: time to structured FNOL,
  evidence completeness, and route counts, shown in the cockpit as the "measurable
  impact" demo beat (see plan.md section 9 and improvements P2.6, which frames
  this as emitting events to a metrics endpoint). The gateway already holds
  every claim's full Twin, including its audit trail, in the in-memory
  `ClaimStore` (D-0007), and the Twin already carries everything the three
  metrics need. Built on a separate branch from D-0013 (B-1), so numbered
  D-0014 to avoid colliding with it once both merge.
- Options: (a) a separate mutable metrics store that each pipeline step pushes
  events into, matching the "first-class events" framing in the improvements
  doc, (b) a pure function that aggregates the existing claim records on every
  read, with no new mutable state.
- Decision: (b). `services/gateway/src/core/metrics.ts` exports
  `computeMetrics(records)`, a pure aggregation over `ClaimRecord[]`. `GET
/api/metrics` calls it against the live `claimStore.list()`. Time to FNOL is
  read from the `claim.created` and `intake.structured` audit entries already
  on the Twin; evidence completeness comes from `twin.completeness.score`;
  route counts come from `twin.recommendation.route`.
- Reason: A second mutable store duplicates state that the claim store already
  holds and risks drifting from it (a metric could outlive or contradict its
  claim). A pure function of existing records is real, live, and derived
  data, exactly what the improvement asked for ("real events beat hardcoded
  numbers"), and it is trivial to unit test without any store or HTTP
  scaffolding. The gateway's own boundary rule (routing and aggregation only,
  no business logic) fits an aggregation function better than a second stateful
  seam.
- Result: `computeMetrics` has 6 unit tests. `GET /api/metrics` is gated like
  the queue and detail routes (D-0010). The cockpit queue page renders a
  four-tile metrics strip above the table, verified against live data with a
  headless-browser screenshot. After merging with D-0013 (`main`), full
  verification (typecheck, lint, format, 128 tests, both app builds, the live
  smoke script) is clean on the combined tree.

## D-0015 - Graph view added to the Twin, built from the anomalies already detected

- Date: 2026-07-18
- Context: The backlog (B-3) called for the suspicious case's demo centerpiece:
  a relationship-graph reveal in the cockpit, currently only text anomaly
  flags. The seeded graph (`data/graph/seed.json`) tracks two relationship
  kinds today: a garage phone number reused across claims, and a reused photo.
  It does not model a "garage" or "vehicle" as its own entity, only phone
  numbers and images.
- Options: (a) a separate `GET /api/claims/:id/graph` gateway endpoint that
  recomputes the graph on request, (b) a `graphView` field on the Twin itself,
  built once during the pipeline run alongside the anomaly flags, (c) hand-roll
  the graph as freeform data in the anomaly `description` strings and let the
  cockpit parse them.
- Decision: (b). `graphViewSchema` (nodes and edges) joins `packages/contracts`
  and is added to `accidentEvidenceTwinSchema` as `graphView`, nullable like
  the other pipeline-built sections. `services/graph/src/core/view.ts` exports
  `buildGraphView(request, anomalies)`, a pure function of the anomalies the
  same request already produced, so the graph view can never disagree with the
  anomaly flags it explains. Node `type` is limited to `'claim' | 'phone'`,
  matching what the seed data actually backs; a `vehicle` or `garage` node type
  is a natural follow-up once the seed data models one, not before.
- Reason: A Twin field matches how every other section (damage, coverage,
  consistency) is already built and matches architecture.md's principle of
  "one coherent system on screen... not internal orchestration": the cockpit's
  detail fetch does not change shape, it just reads one more field. Building it
  from the same `anomalies` array recomputed nothing and could not drift.
  Option (c) would have made the anomaly `description` do double duty as both
  human-readable text and a machine format, which is exactly the kind of
  implicit contract this project's schema-first rule exists to avoid.
- Result: `buildGraphView` has 6 unit tests. Both golden Twin fixtures were
  regenerated (honest: empty view; suspicious: 3 nodes, 3 edges) and
  hand-verified against the anomaly data before being committed. The cockpit
  claim detail page renders a one-click "Reveal relationship graph" panel
  (inline SVG, no charting library) below the decision/why/proof hierarchy,
  visible only when a claim has anomalies. Visual verification with a
  headless-browser screenshot caught and fixed two real rendering bugs before
  commit: the SVG's `width: 100%` stretched a fixed-unit viewBox so text
  rendered roughly 2x too large (fixed with explicit `width`/`height`
  attributes and `max-width` in CSS), and two edge labels converging near the
  focus node overlapped each other and the phone node's own label (fixed by
  shortening the relation text, positioning labels at 40% along their edge
  instead of the midpoint, and alternating the perpendicular offset by edge
  index). Full verification (typecheck, lint, format, 134 tests, both app
  builds, the live smoke script) is clean.

## D-0016 - Docker images build from the full monorepo context, no multi-stage optimization

- Date: 2026-07-18
- Context: The backlog (B-4) called for one Dockerfile per service and app plus
  a compose file, closing the gap between architecture.md's promised
  `docker compose` local orchestration and the empty `infra/docker` and
  `infra/compose` directories. Every workspace member depends on sibling
  packages through pnpm's `workspace:*` protocol, which pnpm resolves with
  symlinks into the actual source directories, not just their `package.json`
  files. Backend services also run via `tsx` directly in production
  (`"start": "tsx src/server.ts"`), so `tsx` and `typescript`, both
  devDependencies, must be present at runtime.
- Options: (a) a single multi-stage Dockerfile with per-service build targets
  selected by `--target`, pruning to a minimal runtime layer with
  `pnpm deploy` or manual copying, (b) one small Dockerfile per service and app
  that copies the whole repository and runs a full `pnpm install
--frozen-lockfile` (no `--prod`, since `tsx` must survive), (c) precompile
  services to plain JavaScript and ship only `dist/` plus production
  dependencies.
- Decision: (b). Each Dockerfile in `infra/docker` is `FROM node:20-alpine`,
  `COPY . .`, `pnpm install --frozen-lockfile`, then a `pnpm --filter
@sinistria/<name> start` (apps run `build` first). `infra/compose/docker-compose.yml`
  wires all eight with ports 4000-4005, 3000, 3001, healthchecks on `/health`,
  and `depends_on: condition: service_healthy` so the gateway waits for its five
  dependencies and both apps wait for the gateway. Backend services get
  `DEMO_MODE=true` by default (matching `.env.example`) and the gateway's
  downstream URLs point at compose service hostnames instead of `localhost`
  (`INTAKE_URL=http://intake:4001`, etc.); both apps get
  `GATEWAY_URL=http://gateway:4000` for their server-side Next.js rewrite.
- Reason: The 72-hour build has no capacity to restructure `tsx`-based services
  around a compile step or to hand-prune a pnpm workspace's symlinked
  `node_modules` correctly. A full-repo build context keeps every Dockerfile
  small and correct at the cost of image size and per-service rebuild time,
  which does not matter for an offline demo. Multi-stage pruning is a real
  option later (see improvements.md) once services compile to plain JS.
- Result: `docker compose -f infra/compose/docker-compose.yml up --build`
  brings up all six services and both apps. Verified over the compose network,
  including a second cold `up` after a full `down` (all eight containers
  healthy both times): the honest claim fast-tracks and notifies after
  approval, the suspicious claim routes to `investigate` with a populated
  `graphView` (3 nodes, 3 edges), `GET /api/metrics` reflects both claims
  correctly through the cockpit's proxy, container logs carry no unexpected
  errors, and no `.env` (only the placeholder `.env.example`) or other secret
  material leaked into an image. Three problems surfaced during verification,
  all fixed before landing:
  1. The sandboxed build environment's registry access is slow enough that a
     full `pnpm install --frozen-lockfile` (about 225 packages) intermittently
     hit `ETIMEDOUT` on a single tarball and failed the whole image. Each
     Dockerfile now sets `npm_config_fetch_retries`, `npm_config_fetch_timeout`,
     and a lower `npm_config_network_concurrency` before the install, which is
     a reasonable resiliency default regardless of environment, not a workaround
     specific to this sandbox.
  2. The `wget`-based healthchecks (`http://localhost:<port>/health`) failed
     with `ECONNREFUSED` even though the service was listening: Alpine's musl
     resolves `localhost` to `::1` first, and Fastify binds `0.0.0.0` (IPv4
     only), so the IPv6 attempt is refused and busybox `wget` does not fall
     back to IPv4. Healthchecks now target `127.0.0.1` directly.
  3. The cockpit's `/api/metrics` proxy returned 500 (`ECONNREFUSED` to
     `localhost:4000`) even with `GATEWAY_URL=http://gateway:4000` set as a
     container runtime environment variable. Next.js resolves a `rewrites()`
     destination once at `next build` time into `routes-manifest.json`; a
     runtime-only environment variable arrives too late to affect it. Fixed by
     passing `GATEWAY_URL` as a Docker build arg (`infra/docker/mobile.Dockerfile`,
     `infra/docker/cockpit.Dockerfile`) so it is set before `pnpm build` runs,
     with `infra/compose/docker-compose.yml` supplying it via `build.args`.
     `infra/docker/.gitkeep` and `infra/compose/.gitkeep` were removed now that
     both directories hold real files.

## D-0017 - Gateway seeds the demo queue in the background after its own health is up

- Date: 2026-07-18
- Context: The backlog (B-5) asked for a realistic cockpit queue at boot in
  demo mode instead of an empty one, so a demo does not depend on someone
  submitting the first live claim on stage. Built on a separate branch from
  B-4 (Docker orchestration), so numbered D-0017 to avoid colliding with
  D-0016 once both merge (the same pattern D-0014 used against D-0013).
  `runClaimPipeline` already depends only on the `ServiceClients` interface
  (D-0005), and the gateway's own routes already call it over real HTTP
  clients (`createHttpClients`), never over the service's own internals.
- Options: (a) have the gateway `fetch` its own `POST /api/claims` endpoint
  once per manifest claim at boot, (b) call `runClaimPipeline` directly with
  the gateway's existing HTTP clients during startup, writing straight into
  the claim store, no self-call to the gateway's own API, (c) seed the store
  with hand-built Twins instead of running the real pipeline.
- Decision: (b). A new `services/gateway/src/core/seed.ts` exports
  `seedDemoQueue(clients, logger)`: it waits for intake, evidence, graph, and
  claims to answer their own `/health` (bounded polling, not a fixed sleep,
  since local `pnpm dev` starts all six processes concurrently with no
  ordering guarantee), then runs every `data/manifest.json` claim through
  `runClaimPipeline` with a stable id (`CLM-DEMO-<ID>`) and saves each Twin
  into the existing `claimStore`. `server.ts` calls it only after `start()`
  resolves and only when `DEMO_MODE` is on, without awaiting it, so the
  gateway's own `/health` is never delayed or put at risk by a slow or
  unreachable dependency. `routes/claims.ts` no longer constructs its own
  `ServiceClients`; `server.ts` builds one instance and passes it to both the
  routes and the seeder.
- Reason: Option (a) is what the backlog explicitly ruled out ("no HTTP
  self-calls"): a self-call adds a network hop for no benefit and couples the
  gateway's own boot sequence to its own route handling. Option (c) would
  drift from the real pipeline the moment either changes. Not awaiting the
  seed keeps the gateway's health endpoint, which docker compose and
  `scripts/smoke.sh` both depend on, honest and immediate regardless of demo
  seeding.
- Result: Verified against the hardest ordering case, not just docker
  compose's dependency-gated one: starting all six services concurrently
  (mirroring `scripts/smoke.sh`'s own pattern) still answers gateway `/health`
  immediately, and `GET /api/claims` reaches all 10 manifest claims within
  seconds, each with its manifest-documented state and route. The unmodified
  `scripts/smoke.sh` still passes unchanged (it submits its own honest claim
  under a fresh id alongside the ten seeded ones). Full verification
  (typecheck, lint, format, 134 tests, both app builds) is clean.

## D-0018 - Scaffold packages/ui with two shared badge components, not a full design system

- Date: 2026-07-18
- Context: The backlog (B-6) asked to move shared colors, spacing, and
  route/confidence badge styles into `packages/ui`, which until now held only
  a README (no `package.json`, never a real workspace member). Auditing the
  two apps' `globals.css` found the route badge existed only in cockpit's
  stylesheet (`--green-900/700/500` were copy-pasted identically into both
  files, `--amber`/`--red` existed only in cockpit's); mobile's demo result
  showed its route in a hardcoded green regardless of actual route, so a
  suspicious claim's `investigate` route rendered in the same color as an
  honest claim's `fast_track`. Confidence had no badge at all in either app,
  just plain text, in tension with the product guardrail that a confidence
  label is always shown, never a naked score.
- Options: (a) keep colors and badge CSS duplicated per app, just deduplicate
  the literal hex values into a shared import, (b) build out `packages/ui` as
  a fuller component library (buttons, cards, layout primitives) in this pass,
  (c) scaffold `packages/ui` with exactly what the backlog named: shared color
  and spacing tokens plus two components, `RouteBadge` and `ConfidenceBadge`,
  that own the route/confidence color mapping so it cannot drift between apps
  again.
- Decision: (c). `packages/ui/src/tokens.css` holds the shared green/amber/red
  scale, a small spacing scale, and the `.badge` rules (route and confidence
  intentionally share one color language: green means trust it, amber means
  check it, red means look closely). `RouteBadge` and `ConfidenceBadge` are
  thin presentational components typed against `ClaimRoute` and
  `ConfidenceLabel` from `@sinistria/contracts`. Both apps' `next.config.mjs`
  add `@sinistria/ui` to `transpilePackages`; each app's own `globals.css`
  keeps only its app-specific background/panel/text tokens (mobile stays dark
  for roadside use, cockpit stays light for desk use) and now `@import`s the
  shared tokens. Every route and confidence rendering in both apps (mobile's
  demo result, the cockpit queue table, the cockpit claim detail page) was
  switched to the shared components, including mobile's previously-hardcoded
  green route text and the confidence label that had no badge anywhere.
- Reason: Option (a) would not have fixed the actual bug (mobile's route
  always rendering green) since the color-to-route mapping would still live
  in two places. Option (b) is scope the backlog did not ask for and this
  pass has no design brief for; a button and card audit is better done as its
  own reviewable change. Option (c) is the smallest change that makes the
  route/confidence-to-color mapping impossible to duplicate incorrectly again,
  matching architecture.md's own description of this package.
- Result: A Next-specific gotcha surfaced during the build (not the typecheck,
  which passed immediately): `export * from './RouteBadge.js'` resolves fine
  under `tsc` (matching every other package's `.js`-extension convention for
  `.ts` files) but Next's webpack resolution for a transpiled package does not
  map a `.js` specifier to a sibling `.tsx` file, only to `.ts`; the build
  failed with `Module not found`. Fixed by re-exporting the two component
  files without an extension. Full verification (typecheck, lint, format, 134
  tests, both app builds) is clean. Visually verified by starting all six
  services and both apps and driving them with Playwright: the honest demo
  case shows a green `FAST TRACK` badge and a green `HIGH` confidence badge;
  the suspicious demo case now shows a red `INVESTIGATE` badge and a red `LOW`
  confidence badge (previously always green); the cockpit queue table and
  claim detail page render the same badges for all ten seeded claims plus the
  two just submitted, with no browser console errors.

## D-0019 - RTL and accessibility fixes scoped to the mobile journey only

- Date: 2026-07-18
- Context: The backlog (B-7, improvements P3.9) asked for `dir="rtl"` for the
  Arabic locale, screen-reader labels, and focus states in the mobile
  journey. Auditing the app found there was no locale switcher at all: the
  submit payload hardcoded `locale: 'derja'` regardless of what a customer
  actually spoke, so Arabic (`'ar'` in `localeSchema`) was unreachable from
  the UI, and `<html lang="fr">` never changed. Two of the app's option
  groups (the safety question, and now the new language choice) rendered a
  bare `<label>` above a row of toggle buttons, which a screen reader does
  not associate with the group the way `<label for>` associates with a
  single control. There was no explicit keyboard-focus style anywhere; every
  interactive element relied on each browser's own default outline.
- Options: (a) add `dir="rtl"` only, treating the label/focus gaps as a
  separate task, (b) do the minimum the backlog literally lists: a locale
  switcher so Arabic is reachable and drives `dir`/`lang`, `role="group"` +
  `aria-labelledby` on the two toggle groups, and an explicit
  `:focus-visible` style, (c) additionally translate every UI string into
  Arabic for a fully localized experience.
- Decision: (b). Added a `locale` state (default `'derja'`, matching prior
  behavior) with a three-way toggle (Derja, Français, العربية) using the same
  button-group pattern already established for the safety question; selecting
  it drives the submit payload's `locale` field, previously hardcoded. `<main
dir={locale === 'ar' ? 'rtl' : undefined} lang={locale === 'ar' ? 'ar' :
undefined}>` flips the whole form to RTL only for Arabic, leaving Derja
  (Latin-script Tunisian Arabic per the seeded narratives) and French as LTR.
  Both toggle groups now use `role="group"` with `aria-labelledby` pointing at
  a `.group-label` span (visually identical to the existing `label` style)
  instead of a floating, unassociated `<label>`. Added one
  `:focus-visible` rule (green outline, matching the existing `aria-pressed`
  indicator color) covering every button, input, textarea, and select.
- Reason: Option (a) alone would still leave Arabic unreachable, since the
  actual product gap was that no path existed to select it, not that
  `dir="rtl"` was missing given a locale that could never be chosen. Option
  (c) is full i18n, a much larger and separately reviewable project the
  backlog does not ask for (improvements.md scopes this item to "front-end
  only" RTL and screen-reader labels, not translated copy); the visible
  strings stay in English/French as before.
- Result: No custom CSS was needed for the mirroring itself: plain flexbox
  under `dir="rtl"` reverses button order and block-level fill bars
  (`.meter > span`) automatically. Verified live with Playwright against the
  built app: selecting العربية sets `dir="rtl"` and `lang="ar"` on the form
  container (confirmed by reading the attributes back), the whole form
  mirrors correctly (heading, text alignment, and the three-button toggle
  order all flip), and `Tab` produces a clearly visible focus ring on the
  next control. Full verification (typecheck, lint, format, 134 tests, both
  app builds) is clean.

## D-0020 - Both apps move to one dark, cinematic design language

- Date: 2026-07-18
- Context: The two apps had drifted into different visual registers (mobile
  dark for roadside use, cockpit light for desk use, per D-0018) and both
  used only system fonts and flat surfaces. Asked for a stage-demo-ready,
  premium redesign across both apps, sharing one identity rather than each
  app inventing its own.
- Options: (a) keep cockpit light and only polish mobile, (b) a shared dark,
  glass-and-glow cinematic language for both apps (deep emerald aurora
  background, glass cards, glowing status badges, `next/font` display and
  body faces, a brand mark, staggered entrance motion), (c) a light,
  restrained corporate look for both apps.
- Decision: (b). `packages/ui/src/tokens.css` now owns the entire shared
  foundation, not just badge colors: the ink and glass surface tokens
  (`--bg`, `--panel`, `--text`, `--muted`, `--line`, previously duplicated
  per app per D-0018) moved here, plus gradients, glow shadows, a spacing and
  radius scale, and a shared `.rise` entrance-animation utility. Added
  `BrandMark`, an inline SVG lens/eye glyph, as a third shared component
  alongside `RouteBadge`/`ConfidenceBadge`. Both apps' badges gained a lit
  status dot and a colored glow matching their route/confidence color.
  `next/font/google` (Space Grotesk for headings, Inter for body) is wired
  into both `layout.tsx` files via CSS variables, so the font files are
  self-hosted in the build output and the demo stays offline-safe. Cockpit's
  queue gained an animated count-up on its metric tiles (`useCountUp`, a
  small `requestAnimationFrame` easing hook, presentational only, keyed off
  the metric value so a re-poll of the same number does not replay it).
- Reason: A shared foundation token file, not per-app duplication, is what
  keeps mobile and cockpit reading as one product as more polish gets added;
  D-0018 already duplicated the ink tokens once and that was the seam most
  likely to drift further. `next/font` was chosen over a CDN `<link>` for
  fonts specifically because the offline-first demo requirement (D-0016,
  `.env.example`'s `DEMO_MODE`) rules out a runtime fetch to Google's font
  CDN; `next/font` downloads and self-hosts at build time instead.
- Result: Full verification (typecheck, lint, format, 134 tests, both app
  builds) is clean. Verified live with Playwright across the full stack (all
  six services plus both apps): the honest demo case renders a glowing green
  `FAST TRACK` badge, the suspicious case a glowing red `INVESTIGATE` badge,
  Arabic RTL still mirrors correctly under the new layout, the cockpit queue's
  metric tiles count up on load, and the relationship graph reveal renders
  with glowing nodes against the dark background. No console errors in any
  captured screenshot. `bash scripts/smoke.sh` still passes unchanged.

## D-0021 - Hand-authored SVG diagrams instead of mermaid-cli output

- Date: 2026-07-18
- Context: Needed a system architecture diagram and a request-flow diagram for
  external technical documentation (a submission data room), on brand, as
  portable standalone SVG files.
- Options: (a) `mermaid-cli` with a custom theme and embedded fonts, (b)
  hand-authored SVG (plain shapes, text, and paths generated by a small
  Python script) with the same embedded fonts.
- Decision: (b). `mermaid-cli`'s `htmlLabels: true` mode (needed for bold text
  and line breaks in labels) renders labels via `<foreignObject>`, which many
  real-world SVG consumers (older PDF converters, some Office embedding
  paths, `librsvg`-based tools) do not render at all; `htmlLabels: false` gives
  portable plain `<text>`, but that mode's automatic node sizing clipped text
  and dropped markdown bold formatting. Two diagrams do not justify continuing
  to fight the auto-layout engine for exact control. `docs/diagrams/*.svg` are
  generated by throwaway scripts (not committed) that place plain `<rect>`,
  `<text>`, and `<path>` elements at explicit coordinates and inline the
  brand's actual fonts (Space Grotesk, Inter) as base64 `@font-face` rules, so
  the SVG is self-contained and renders identically everywhere.
- Reason: For a one-time, small set of diagrams, explicit coordinates are more
  reliable than debugging an auto-layout tool's text-measurement edge cases,
  and guaranteed `<text>`-only output is the safer choice for a document meant
  to be embedded in a data room submission of unknown tooling.
- Result: `docs/diagrams/architecture.svg` (full system, labeled with the
  production-target integrations: hosted speech/vision/LLM providers behind
  the existing adapter interfaces, and a persistent store behind the existing
  `ClaimStore` seam) and `docs/diagrams/dataflow.svg` (the six-step honest-claim
  journey), both referenced from `docs/architecture.md`. Verified by rendering
  in a real browser (Chromium via Playwright); no text clipping, all fonts
  render as embedded.

## D-0022 - Replace the placeholder brand mark with the designed logo

- Date: 2026-07-18
- Context: `packages/ui`'s `BrandMark` and both apps' favicons used a
  hand-drawn placeholder (a plain almond outline with a solid pupil),
  built as a stand-in while the redesign (D-0020) was in progress. A
  designed logo (an eye built from overlapping camera-aperture blades,
  reading as both "witness" and "capture") was produced externally and
  supplied as a raster image on a solid dark ground.
- Options: (a) keep the hand-drawn placeholder mark, (b) vectorize the
  supplied artwork, (c) use the supplied raster image directly, with its
  background keyed to transparent so it drops onto any surface.
- Decision: (c). The flat near-black background was removed with
  ImageMagick color-keying (`-fuzz 8% -transparent`), producing a clean
  cutout with no fringing, then resized for each use: `BrandMark` embeds a
  160px version as a base64 data URI (self-contained in the shared
  package, no per-app `public/` file needed), and both apps'
  `app/icon.png` use a 256px version. Vectorizing (b) risked losing the
  gradient's smoothness and was unnecessary once the cutout worked
  cleanly at every size actually used.
- Reason: The mark is only ever rendered at 16 to 96px in this product (app
  header, browser tab); a raster cutout at those sizes is indistinguishable
  from a vector one and is far less work than re-drawing the artwork as
  paths. Embedding rather than referencing a public file keeps `BrandMark`
  a true drop-in shared component, matching how `tokens.css` is consumed.
- Result: Verified in a real browser at 16px, 32px, and the app header's
  26px: the eye silhouette reads clearly at every size, the fine
  inner-iris crossing lines soften into the center at 16px but do not
  break the shape. `pnpm typecheck`, `lint`, `format:check`, `test`, and
  `build` all pass.

## D-0023 - Brand kit and data room export to PDF via Playwright, not pandoc

- Date: 2026-07-18
- Context: The hackathon submission needs the brand kit and the data room as
  standalone PDFs, on brand, for reviewers who will not clone the repo.
  `pandoc` is not installed on this machine; `python3-markdown` is.
- Options: (a) install pandoc for a direct markdown-to-PDF path, (b) convert
  each markdown source to HTML with `python-markdown`, wrap it in the same
  brand tokens and embedded fonts already built for the diagrams (D-0021)
  and the on-screen brand kit, then print to PDF with Playwright's
  `page.pdf()`.
- Decision: (b). Two small build scripts (not committed; generated
  artifacts only) produce a self-contained HTML page per document, with
  print-specific CSS (`break-inside: avoid`, `break-after: avoid` on
  headings) for clean pagination, then a Playwright script renders each to
  PDF at A4 with backgrounds enabled.
- Reason: Installing a new system tool needs the user's explicit choice
  per this repo's tooling rule; the HTML route reuses fonts, tokens, and
  diagrams already built for the brand, so the PDFs match the product's
  actual visual identity instead of a generic markdown stylesheet.
- Result: `Sinistria-Brand-Kit.pdf` (3 pages) and `Sinistria-Data-Room.pdf`
  (4 pages, both diagrams embedded), each verified by converting every page
  to PNG and inspecting it directly. Kept out of the repository; these are
  generated submission artifacts, not source.

## D-0024 - Concept note cites public market data, and the BMC states it is a working draft

- Date: 2026-07-18
- Context: The submission checklist asks for an updated concept note with a
  Business Model Canvas. This repo has no measured pricing, market size, or
  partnership data of its own to draw on.
- Options: (a) draft plausible-sounding figures for pricing and market size
  without sourcing them, (b) search for and cite real public data (Tunisia's
  insurance-sector reporting, published AI-claims-automation benchmarks,
  MENA insurtech funding rounds) for every market claim, and mark the BMC's
  own pricing and channel choices explicitly as a pilot-stage draft, not a
  commitment.
- Decision: (b). `docs/concept-note.md` links every market figure inline to
  its public source and states outright that BMC pricing and channels are
  hypotheses to validate in a pilot.
- Reason: Fabricated business figures in submission material the project
  would be judged on is exactly the kind of misleading claim this repo's
  established "honest-but-confident" framing (see the prototype and demo
  materials, this same section of work) rules out; real, sourced numbers
  are stronger evidence than invented ones and survive scrutiny.
- Result: `docs/concept-note.md` added, linked from `README.md`. Six
  sources cited (Atlas Mag x2, an academic paper on AI in Tunisian
  insurance, Bain & Company, RaftLabs, fintech.global, insnerds.com).

## D-0025 - Pitch deck built as a native PPTX, not a flattened PDF export

- Date: 2026-07-18
- Context: The submission needs a pitch deck. The brand kit and data
  room PDFs (D-0023) were built by printing a styled HTML page, which
  gives full design control but produces a flat, non-editable document;
  a deck is more likely to need last-minute edits before a live pitch.
- Options: (a) build the deck the same way as the other PDFs (HTML to
  PDF via Playwright), (b) generate a real `.pptx` with `python-pptx`
  so every slide stays editable in PowerPoint or LibreOffice.
- Decision: (b). `python-pptx` was not installed; per this repo's
  tooling rule (check before you use, do not auto-install without
  asking) the user was asked, chose to install it, and it was installed
  into a throwaway virtualenv under the scratchpad, not system-wide,
  since the machine's Python is externally managed (Arch). The deck's
  diagrams and product screenshots are still the same brand-styled SVGs
  and live-app captures used elsewhere; the two SVG diagrams were
  rasterized to PNG first since `python-pptx` has no native SVG support.
- Reason: A hackathon deck gets last-minute wording and ordering changes
  more often than a data room or brand kit does; native shapes and text
  boxes survive that, a flattened PDF does not. The venv keeps the
  install fully reversible and off the system Python.
- Result: `Sinistria-Pitch-Deck.pptx` (12 slides), verified by
  converting it to PDF with LibreOffice (already present on this
  machine) and inspecting every slide as a rendered image. An HTML/PDF
  version of the same deck was also kept for quick web viewing.

## D-0026 - Demo video assembled from real Playwright recordings, not a mockup

- Date: 2026-07-18
- Context: The submission checklist asks for a 2-minute demo video. A
  shot-by-shot script already existed (`docs/demo-video-script.md`).
- Options: (a) hand-wave a description of the flow without a real
  capture, (b) record the actual running apps with Playwright's built-in
  video recording, then burn in captions with `ffmpeg` timed against the
  real, observed transitions.
- Decision: (b). Two silent screen recordings (mobile: idle to honest
  fast-track to suspicious investigate; cockpit: queue to graph reveal
  to approve) were captured at 1280x720 with Playwright's
  `recordVideo`, against the live dev stack. Caption timing was derived
  by sampling the raw recordings frame-by-frame (not the idealized
  script timings), since the real UI's animation and API-response
  timing differs from any estimate. Title/closing cards reuse the
  pitch deck's own cover and closing slides for visual consistency.
- Reason: A demo video's entire value is proof the thing actually runs;
  a mockup would misrepresent completed work as still-imagined, which
  this repo's own honesty conventions already rule out for other
  materials (see D-0024). Sampling the real recording for caption
  timing avoids captions drifting out of sync with what's on screen,
  which reads as sloppier than no captions at all.
- Result: `Sinistria-Demo-Video.mp4` (58.8s, 1280x720, silent with
  burned-in captions), verified by extracting frames at each caption
  boundary and confirming no overlapping captions and no caption
  mismatched with the visible screen state.
