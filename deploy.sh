#!/usr/bin/env bash
# Deploys the production stack. Run this on the production server from the repo root
# (/opt/geraldvillorente). Always pins the compose files explicitly — a bare
# `docker compose up` falls back to docker-compose.yml (the dev config), whose
# postgres/web port bindings can collide with other containers on this shared host.
set -euo pipefail

cd "$(dirname "$0")"

# Load .env into this shell so vars like CLOUDFLARE_ZONE_ID/CLOUDFLARE_API_TOKEN are
# available below — docker compose's `env_file:` only injects these into containers,
# it does not export them here.
if [[ -f .env ]]; then
  set -a
  source .env
  set +a
fi

git pull origin main

docker compose -f docker-compose.prod.yml -f docker-compose.server.yml \
  up -d --build postgres redis api web

docker compose -f docker-compose.prod.yml -f docker-compose.server.yml ps

# Optional: purge the Cloudflare cache after deploying, so visitors don't get stale
# HTML/assets served from Cloudflare's edge. Set these in the server's .env (or export
# them before running this script) to enable it — skipped silently if either is unset.
if [[ -n "${CLOUDFLARE_ZONE_ID:-}" && -n "${CLOUDFLARE_API_TOKEN:-}" ]]; then
  echo "Purging Cloudflare cache..."
  curl -s -X POST "https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/purge_cache" \
    -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
    -H "Content-Type: application/json" \
    --data '{"purge_everything":true}'
  echo
else
  echo "Skipping Cloudflare cache purge (CLOUDFLARE_ZONE_ID / CLOUDFLARE_API_TOKEN not set)."
fi
