# Testing and security audit

Date: 2026-07-18

This audit covers the repository as it exists after the vertical-slice hardening
pass. It includes the source, service boundaries, contracts, frontends, fixtures,
documentation, and the live local HTTP path.

## Verification performed

- `pnpm typecheck`: 13 of 13 workspace projects passed.
- `pnpm lint`: 12 lint-enabled projects passed. The three packages without a
  lint script are packages that contain no runtime source lint target.
- `pnpm format:check`: passed for the complete repository.
- `pnpm test`: 8 test-enabled projects passed, 121 tests passed (113 plus 8 new
  fixture-manifest and golden-Twin tests, see D-0012), and the gateway package
  correctly reported no test files.
- `pnpm build`: both Next.js applications compiled and generated production
  routes successfully.
- `bash scripts/smoke.sh`: passed over HTTP with all six backend services,
  including submit, fast-track recommendation, human approval, and notification.
- Production-mode gateway check: an unauthenticated adjuster queue request
  returned 401, while the configured bearer token returned 200.
- `pnpm audit --prod`: no known vulnerabilities after the PostCSS override.

The first smoke attempt was blocked by the execution sandbox refusing the IPC
pipes that `tsx` creates for parallel processes. The same script passed when run
with the required local-process permission. This is an environment limitation,
not an application failure.

## Findings fixed

1. The suspicious mobile demo was unreachable, and its garage phone was not
   submitted. The UI now exposes both demo buttons, permits an optional garage
   phone, and forwards it to graph analysis.
2. The `confirmed` customer answer was accepted but ignored. The public claim
   and internal intake schemas now require the literal value `true`, preventing
   unconfirmed facts from entering processing.
3. Boundary payloads had no practical size limits. Claim text, media references,
   identifiers, phone numbers, and notification messages now have bounded sizes.
4. The eligibility gate matched `fire` as an arbitrary substring. It now uses
   word and phrase boundaries, preserving `feu rouge` and avoiding unrelated
   words such as `firewall`.
5. Claims described coverage as confirmed even when the coverage flag was false.
   The reason now reflects the actual coverage result.
6. Investigation explanations could name only contradictions or unusual
   patterns even when the trigger was severe damage. The cockpit reason is now
   neutral and accurate for every trust signal.
7. Unexpected Fastify failures returned their raw error message to callers.
   Five-hundred-level responses now return a generic message while retaining
   the correlation id and full server-side log entry.
8. The production dependency graph included vulnerable PostCSS 8.4.31. A pnpm
   override pins the patched 8.5.19 line, and the production audit is clean.

## Remaining deployment controls

These are intentionally outside the offline demo slice and must be addressed
before exposing the gateway to real users:

- The gateway has a temporary shared bearer-token guard for adjuster queue,
  detail, and decision routes when `DEMO_MODE=false`. It still needs an identity
  provider and per-user roles before production use.
- The demo uses an in-memory claim store. Production persistence must provide
  access control, encryption, retention, and a recovery path for notification
  failures.
- Internal services listen on all interfaces for local orchestration. Production
  networking must keep them private and allow only the gateway to reach them.
- The mock speech, vision, OCR, and SMS adapters are deterministic fixtures, not
  production provider integrations. Provider credentials belong only in the
  deployment secret manager.
- Browser-level accessibility, Arabic RTL behavior, and real-provider contract
  tests remain follow-up work.
