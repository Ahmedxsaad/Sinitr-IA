# Mobile app image. Build from the repo root so pnpm workspace dependencies
# resolve: docker build -f infra/docker/mobile.Dockerfile .
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

# Next.js resolves the /api rewrite destination at build time and bakes it
# into routes-manifest.json, so GATEWAY_URL must be present for `next build`,
# not just for the `next start` process later. Defaults to the compose
# service hostname; override at build time for a different target.
ARG GATEWAY_URL=http://gateway:4000
ENV GATEWAY_URL=${GATEWAY_URL}
RUN pnpm --filter @sinistria/mobile build

ENV NODE_ENV=production
EXPOSE 3000
CMD ["pnpm", "--filter", "@sinistria/mobile", "start"]
