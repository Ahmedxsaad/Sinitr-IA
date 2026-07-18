# Signals service image. Build from the repo root so pnpm workspace
# dependencies resolve: docker build -f infra/docker/signals.Dockerfile .
# (or use infra/compose/docker-compose.yml, which sets this up already).
FROM node:20-alpine
WORKDIR /app

RUN corepack enable
# The install pulls ~225 packages; be tolerant of a slow or flaky network
# instead of failing the whole image on one dropped connection.
ENV npm_config_fetch_retries=5 \
    npm_config_fetch_timeout=300000 \
    npm_config_fetch_retry_mintimeout=20000 \
    npm_config_fetch_retry_maxtimeout=120000 \
    npm_config_network_concurrency=4
COPY . .
RUN pnpm install --frozen-lockfile

ENV NODE_ENV=production
EXPOSE 4006
CMD ["pnpm", "--filter", "@sinistria/signals", "start"]