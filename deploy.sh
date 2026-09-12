#!/usr/bin/env bash
# Deploys the production stack. Run this on the production server from the repo root
# (/opt/geraldvillorente). Always pins the compose files explicitly — a bare
# `docker compose up` falls back to docker-compose.yml (the dev config), whose
# postgres/web port bindings can collide with other containers on this shared host.
set -euo pipefail

cd "$(dirname "$0")"

git pull origin main

docker compose -f docker-compose.prod.yml -f docker-compose.server.yml \
  up -d --build postgres redis api web

docker compose -f docker-compose.prod.yml -f docker-compose.server.yml ps
