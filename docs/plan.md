# Sinistr'IA - Plan

The plan we build against. High level and stable. Technical detail lives in
[architecture.md](architecture.md); process rules live in
[conventions.md](conventions.md).

## 1. Summary

Sinistr'IA is a Derja-first AI accident witness. In the first minutes after a
motor accident it guides the driver through voice, guided photo or video, and
document capture, then converts everything into one explainable, auditable
Accident Evidence Twin. An adjuster reviews the Twin and owns the decision.

North star: Capture the truth. Fast-track the honest. Investigate the suspicious.

## 2. Scope

In scope for the build:

- Low-severity, property-damage-only motor claims with clear coverage.
- Derja voice intake with Arabic and French fallback.
- Guided evidence capture that improves inputs before analysis.
- The Accident Evidence Twin: timeline, damage map, policy match, consistency,
  completeness, confidence, and audit trail.
- Adjuster cockpit with fast-track, review, and investigate routes.
- Two scripted demo cases: one honest and eligible, one suspicious and
  explainable.

Out of scope (roadmap only):

- Bodily injury, disputed liability, and complex hidden damage in the automation
  path (these escalate to a human).
- Autonomous settlement or automatic payout.
- Lines other than motor (health, travel, property, agriculture).
- Local model training. We use hosted speech, vision, and language APIs.

## 3. Architecture at a glance

Microservices monorepo (pnpm workspaces). Three layers map to clear ownership.

```
Customer capture      ->   Evidence intelligence   ->   Claims cockpit
apps/mobile                services/evidence             apps/cockpit
services/intake            services/graph                services/claims
                                                         services/notify
                     services/gateway ties it together
             packages/contracts holds the shared Evidence Twin
```

Full folder tree and service contracts are in [architecture.md](architecture.md).

## 4. Services and ownership

Ownership uses workstream labels, not personal names, so the mapping survives
team changes.

| Part               | Workstream owner         | Responsibility                                           |
| ------------------ | ------------------------ | -------------------------------------------------------- |
| apps/mobile        | Mobile and live journey  | Derja customer journey, guided capture, link or QR entry |
| apps/cockpit       | Cockpit and visual story | Adjuster review of the Twin, routes, approve action      |
| services/gateway   | Integration              | Single entry point, routing, auth, aggregation           |
| services/intake    | Voice and intake         | Speech to structured FNOL, safety and eligibility gates  |
| services/evidence  | Multimodal intelligence  | OCR, damage localization, consistency, builds the Twin   |
| services/claims    | Claims logic             | Policy grounding, trust gates, recommendation and route  |
| services/graph     | Multimodal intelligence  | Relationship graph and anomaly flags                     |
| services/notify    | Integration              | SMS and status updates                                   |
| packages/contracts | Shared, all workstreams  | Accident Evidence Twin schema, DTOs, event types         |

## 5. Data flow (the evidence loop)

1. Protect. Mobile asks about injuries and danger first. High-risk cases bypass
   automation.
2. Capture. Intake orchestrates Derja voice transcription and structures FNOL
   fields, then runs the safety and eligibility gates.
3. Reconstruct. Evidence runs guided capture checks, OCR, damage localization,
   and assembles the Accident Evidence Twin.
4. Verify. Evidence checks story against image against document. Graph adds
   relationship and anomaly signals.
5. Recommend. Claims grounds coverage in policy clauses, applies trust gates,
   and produces a route with reasons and a confidence label.
6. Decide. Cockpit shows the Twin. The adjuster approves, and notify sends the
   customer an SMS or status update.

## 6. Tech stack

- Language: TypeScript across frontends and services for one shared toolchain
  and a single shared Evidence Twin contract (Zod). See decision D-0002.
- Frontends: Next.js (App Router) for `mobile` and `cockpit`.
- Services: lightweight Node HTTP services (Fastify) with OpenAPI contracts.
- Shared: pnpm workspaces plus Turborepo for task orchestration and caching.
- AI: hosted speech, vision or multimodal, and language APIs. Deterministic
  rules for eligibility, safety, coverage conditions, and escalation.
- Orchestration: docker compose for local multi-service runs.

Python per service stays possible later because services are decoupled behind
HTTP. If a service needs it, that is a new decision-log entry.

## 7. Milestones (72-hour build)

The critical path first, then parallel depth. See the playbook for the hour grid.

- Day 1, end-to-end skeleton. Lock the shared Twin schema, connect Derja and
  French intake, the safety gate, and one honest case through to the cockpit.
- Day 2, evidence intelligence. Add guided capture, document extraction, damage
  localization, policy grounding, and story-versus-evidence checks.
- Day 3, hardening. Add the suspicious case and graph reveal, trust controls,
  polished UI, live metrics, SMS, and validated offline fallbacks.

Critical path rule: by hour 12, one honest claim must travel from voice input to
a visible cockpit result. Every later feature is optional until that path is
stable.

## 8. Demo

Four-minute live contrast: one honest claim fast-tracked, one suspicious claim
investigated. All hero media, policy excerpts, and graph data are seeded locally
so the demo never depends on venue internet. See the playbook for the beat grid.

## 9. Metrics we show live

- Time to structured FNOL, target under 60 seconds.
- Evidence completeness rising visibly toward above 90 percent.
- Selected-field extraction quality on the curated demo set.
- Every recommendation carries evidence plus a policy clause.
- Human preparation time, target 10 to 17 minutes on the pilot workflow.
- Full journey works with venue internet down (fallback success).

All figures are labelled targets or pilot hypotheses, never measured production
accuracy. See [conventions.md](conventions.md) for the language rules.

## 10. Governance

- Commits, branches, code style: [conventions.md](conventions.md).
- Decisions with reasons and results: [decision-log.md](decision-log.md).
- Proposed improvements: [improvements.md](improvements.md).
