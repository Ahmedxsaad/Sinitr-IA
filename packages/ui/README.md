# packages/ui

Shared React components and design tokens used by both `apps/mobile` and
`apps/cockpit`, so the two surfaces stay visually consistent.

- `RouteBadge`, `ConfidenceBadge`: colored pills for a claim's route and
  confidence label, the only place the route/confidence color mapping is
  defined.
- `tokens.css`: the shared color and spacing tokens plus the badge styles.
  Import it once per app, alongside that app's own background/text tokens.

Follows the monorepo's shared conventions (see [../../docs/conventions.md](../../docs/conventions.md)).
