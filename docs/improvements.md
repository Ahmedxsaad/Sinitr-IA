# Sinistr'IA - Proposed improvements

Improvements I propose on top of the submission and playbook. Each has a
priority, the idea, why it helps, and its cost. Nothing here is committed until
it becomes a decision-log entry. Priorities: P1 do early, P2 if time, P3 later.

## P1 - Do these early, they de-risk the demo

### 1. A single claim state machine as the backbone

Model each claim as an explicit state: `capturing -> reconstructing ->
verifying -> recommended -> decided -> notified`, plus `escalated`. Every
service transitions the claim through defined states.
Why: makes the flow testable, makes "where is this claim" answerable, and gives
the cockpit a clean status to render. Cost: small, define it in `contracts`.

### 2. Correlation id on every request and log line

Generate one id per claim and pass it through the gateway to every service and
into every log line and audit entry.
Why: the audit trail, the cockpit "why" panel, and the live metrics all read
from the same trace. Cost: small, lives in `packages/logger`.

### 3. Golden-file tests for the two hero cases - done, see D-0012

Store the expected Accident Evidence Twin for the honest case and the suspicious
case as fixtures, and assert the pipeline reproduces them.
Why: hardening on day 3 is where demos break. A golden test catches a
regression in seconds. Cost: small once the two cases exist.

### 4. Deterministic demo mode and offline fallback in code

A `DEMO_MODE` flag that forces seeded inputs and cached model responses, and an
offline switch that serves local media and graph data.
Why: the playbook requires the full journey to work with venue internet down.
Bake it in rather than improvising on stage. Cost: medium, but reused by tests.

## P2 - Strong if time allows

### 5. The trust gate as a pure, unit-tested rules module

Keep the escalation gates (injury, disputed liability, low confidence, hidden
damage, contradictions, unusual pattern) in one deterministic, readable module
in `services/claims`, fully unit tested.
Why: this module is the credibility centerpiece the risk jury will probe. Rules
must be explainable, not buried in a model. Cost: medium.

### 6. Metrics as first-class events

Emit `time_to_fnol`, `evidence_completeness`, and route counts as events to a
lightweight metrics endpoint the cockpit reads live.
Why: the demo shows measurable impact. Real events beat hardcoded numbers and
keep the "labelled as targets" honesty. Cost: medium.

### 7. Schema-validate every model output before trusting it

Validate hosted-model outputs against the `contracts` Zod schemas at the service
boundary. Reject or downgrade confidence on invalid output.
Why: protects the Twin from malformed model responses and enforces the boundary.
Cost: small, and it prevents a class of live-demo failures.

### 8. Fixture manifest and validator for seed data - done, see D-0012

A manifest listing each synthetic claim, policy, image, and graph node, plus a
script that checks every fixture matches the contract schema.
Why: honest, labelled synthetic data that provably matches the workflow. Cost:
small.

## P3 - Worth planning for, not now

### 9. Arabic RTL and accessibility in the mobile journey

Right-to-left layout and screen-reader labels for the Arabic path.
Why: real for a Derja and Arabic product, and a quiet differentiator. Cost:
medium, front-end only.

### 10. Central model and prompt config

Keep model ids, prompts, and thresholds in `packages/config` so they are
swappable in one place.
Why: one place to tune or fall back, and no scattered magic values. Cost: small.

## Open tradeoff to decide together

Microservices give clean ownership but add run and deploy overhead in a 72-hour
window. Proposal: keep the service boundaries in code as designed, but allow
running several services in one process locally through `docker compose` if the
ops cost bites. Modular now, independently deployable later. This would become a
decision-log entry if we adopt it.
