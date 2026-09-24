#!/usr/bin/env bash
# Deploys the production stack. Run this on the production server from the repo root
# (/opt/geraldvillorente). Always pins the compose files explicitly — a bare
# `docker compose ...` fails by design (docker-compose.yml is a guard stub), and
# the dev stack (docker-compose.dev.yml) must never run on this shared host.
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
  # Sanity-check that the zone actually belongs to this site: a stale zone ID from
  # another domain makes the purge below report success while changing nothing for
  # us (this exact bug kept deploys serving day-old HTML). Warn-only — a flaky API
  # must never break a deploy.
  ZONE_NAME="$(curl -4 -s "https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}" \
    -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" | grep -o '"name":"[^"]*"' | head -1 | cut -d'"' -f4 || true)"
  SITE_HOST="$(echo "${FRONTEND_URL:-}" | sed -e 's#^https\?://##' -e 's#/.*##')"
  if [[ -n "${ZONE_NAME:-}" && -n "${SITE_HOST:-}" && "$ZONE_NAME" != "$SITE_HOST" ]]; then
    echo "WARNING: CLOUDFLARE_ZONE_ID resolves to zone '${ZONE_NAME}' but this site is '${SITE_HOST}' — fix .env or the purge below is a no-op."
  fi
  echo "Purging Cloudflare cache..."
  # -4: the API token is restricted to the server's IPv4 egress; over IPv6 the API
  # rejects it ("Cannot use the access token from location").
  curl -4 -s -X POST "https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/purge_cache" \
    -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
    -H "Content-Type: application/json" \
    --data '{"purge_everything":true}'
  echo
else
  echo "Skipping Cloudflare cache purge (CLOUDFLARE_ZONE_ID / CLOUDFLARE_API_TOKEN not set)."
fi
