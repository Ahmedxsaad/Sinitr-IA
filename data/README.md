# data

Synthetic demo data. Golden rule: synthetic data is acceptable when it is
labelled honestly and used to prove the workflow, not to fake production
accuracy.

- `manifest.json` - the checklist of every fixture below, validated against
  `fixtureManifestSchema` by `tests/e2e/src/fixtures.test.ts`. Add a fixture
  here whenever you add one to a folder below.
- `claims/` - synthetic simple motor claims (target 10 to 20). `honest.json`
  and `suspicious.json` are the two polished hero cases; each has a matching
  `*.expected-twin.json` golden fixture asserted by
  `tests/e2e/src/golden.test.ts`.
- `policies/` - policy and guarantee examples with explicit coverage clauses,
  validated against `policyFixtureSchema`. Loaded by `services/claims`.
- `media/` - real media files, if any are added later. The demo currently
  represents media as seed refs (`seed:<case>:<kind>:<a>:<b>`, see
  `services/evidence/src/adapters/seed-ref.ts`) rather than actual bytes, so
  every media fixture the pipeline uses is listed in `manifest.json` even
  though this folder itself stays empty.
- `graph/` - one seeded relationship graph with claims, vehicles, phone numbers,
  and garages, validated against `graphSeedFixtureSchema`. Loaded by
  `services/graph`.

Every fixture matches a `packages/contracts` schema, checked by the fixture
manifest validator. Two polished hero cases (one honest, one suspicious) carry
manually verified expected outputs.

Machine-local or uncurated files go in a `local/` subfolder, which is gitignored.
