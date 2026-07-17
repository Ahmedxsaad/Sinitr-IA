# data

Synthetic demo data. Golden rule: synthetic data is acceptable when it is
labelled honestly and used to prove the workflow, not to fake production
accuracy.

- `claims/` - synthetic simple motor claims (target 10 to 20).
- `policies/` - policy and guarantee examples with explicit coverage clauses.
- `media/` - constat images (clean, skewed, handwritten, incomplete), damage
  images, and audio samples.
- `graph/` - one seeded relationship graph with claims, vehicles, phone numbers,
  and garages.

Every fixture should match the `packages/contracts` schema. Two polished hero
cases (one honest, one suspicious) carry manually verified expected outputs.

Machine-local or uncurated files go in a `local/` subfolder, which is gitignored.
