# geraldvillorente.com

Personal site for Gerald Villorente — Drupal/DevOps engineer and technical leader.

**Stack:** Next.js 16 · Express 5 · PostgreSQL 18 · Redis 8 · Docker

---

## Local dev quickstart

**Prerequisites:** Docker Desktop, Node 25+, npm 11+

```bash
# 1. Clone and copy env
cp .env.example .env
# Edit .env — set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, SMTP_* if needed

# 2. Start all services (or: npm run dev)
docker compose -f docker-compose.dev.yml up --build

# 3. Run migrations (first time only)
docker compose -f docker-compose.dev.yml exec api node -e "
  import('@gv/db/migrate.js')
" 
# Or from the host (requires local pg connection):
POSTGRES_HOST=localhost npm run migrate

# 4. (Optional) Seed default data
POSTGRES_HOST=localhost npm run seed
```

Services:
- Frontend: http://localhost:8899
- API: http://localhost:4000
- Health: http://localhost:4000/api/health

---

## Running migrations

From host (connect to Docker Postgres):
```bash
POSTGRES_HOST=localhost POSTGRES_PORT=5432 \
POSTGRES_DB=gv_db POSTGRES_USER=gv_user POSTGRES_PASSWORD=changeme \
npm run migrate --workspace=packages/db
```

Inside the api container:
```bash
docker compose -f docker-compose.dev.yml exec api sh
# Then:
cd /app && node ../../packages/db/migrate.js
```

---

## Creating the first admin user

1. Run seed once — creates a placeholder user at `gerald@geraldvillorente.com`:
   ```bash
   npm run seed --workspace=packages/db
   ```

2. Log in via Google OAuth at `http://localhost:4000/api/auth/google`.

3. The OAuth upsert will overwrite the `google_id` placeholder with your real Google ID.
   Role is `subscriber` by default after first login.

4. Manually promote to admin via psql:
   ```sql
   UPDATE users SET role = 'admin' WHERE email = 'gerald@geraldvillorente.com';
   ```

---

## Project structure

```
geraldvillorente.com/
├── apps/
│   ├── web/              Next.js 16 (App Router, TailwindCSS 4)
│   └── api/              Express 5 (auth, CRUD, media upload)
├── packages/
│   └── db/               SQL migrations + migrate.js + seed.js
├── docker/
│   └── nginx/            Production reverse proxy config
├── docker-compose.yml         Guard stub (bare `docker compose` fails here on purpose)
├── docker-compose.dev.yml     Development
├── docker-compose.prod.yml    Production
└── VERSIONS.md
```

---

## Admin panel

After authenticating via Google OAuth:
- Dashboard: http://localhost:8899/admin
- Posts: http://localhost:8899/admin/posts
- Media: http://localhost:8899/admin/media
- Menus: http://localhost:8899/admin/menus
- Users: http://localhost:8899/admin/users (admin role required)

---

## Production deployment

```bash
# On the production server, deploy with ./deploy.sh — it pulls main, pins the
# prod compose files, and purges Cloudflare cache. Manual equivalent:

docker compose -f docker-compose.prod.yml up -d --build

# Migrations
docker compose -f docker-compose.prod.yml exec api \
  node /app/../../packages/db/migrate.js

# SSL via Let's Encrypt (first time)
docker compose -f docker-compose.prod.yml --profile certbot run --rm certbot \
  certonly --webroot -w /var/www/certbot \
  -d geraldvillorente.com -d www.geraldvillorente.com \
  --email gerald@geraldvillorente.com --agree-tos
```

Update `docker/nginx/default.conf` to add the SSL server block after cert issuance.

---

## Environment variables

See `.env.example` for all variables. Minimum required for full functionality:

| Variable | Required for |
|---|---|
| `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` | Admin login |
| `JWT_SECRET` + `JWT_REFRESH_SECRET` (32+ chars each) | Auth tokens |
| `SMTP_*` | Contact form emails |
| `NEXT_PUBLIC_GISCUS_*` | Blog comments |

The API logs a warning on startup for any missing critical env vars.
