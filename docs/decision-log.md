# Sinistr'IA - Decision log

One entry per non-obvious choice. Newest at the bottom. Keep entries short. See
the format note in [conventions.md](conventions.md).

Template:

```
### D-XXXX - Title
- Date:
- Context:
- Options:
- Decision:
- Reason:
- Result:
```

---

### D-0001 - Repository shape: microservices monorepo
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

### D-0002 - Language: TypeScript across frontends and services
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

### D-0003 - Governance files: CLAUDE.md with AGENT.md symlink per part
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
