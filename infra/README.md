# infra

Deployment and local orchestration.

- `docker/` - one Dockerfile per service and app.
- `compose/` - docker compose files that bring the whole system up locally.

Offline first for the demo: hero media, policy excerpts, and graph data are
cached locally so the core interaction stays live without venue internet.
