# infra

Deployment and local orchestration.

- `docker/` - one Dockerfile per service and app.
- `compose/` - docker compose files that bring the whole system up locally.

Offline first for the demo: hero media, policy excerpts, and graph data are
cached locally so the core interaction stays live without venue internet.

## Run the full stack

From the repo root:

```sh
docker compose -f infra/compose/docker-compose.yml up --build
```

Brings up all seven backend services (ports 4000-4006) and both frontends
(mobile on 3000, cockpit on 3001) in demo mode. `signals` (4006) is standalone
and not in the gateway's `depends_on`; every other service is required for the
gateway to report healthy. Stop with `Ctrl-C` or
`docker compose -f infra/compose/docker-compose.yml down`. See
[../.env.example](../.env.example) for the full list of variables; the
compose file only overrides what differs from local defaults (service
hostnames instead of `localhost`).
