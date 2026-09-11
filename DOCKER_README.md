# Docker Setup — Shiftinger

This app is a **single unified full-stack application** built with
**TanStack Start** (React 19 + Vite). One Node process performs **both**:

- **Frontend** — server-side rendered React pages, and
- **Backend** — server functions (`createServerFn`) that hold the business logic.

Its database/auth layer is **Supabase (PostgreSQL)**.

Because the frontend and backend live in the *same* codebase and server, the
Docker setup here is:

| Service    | Image base            | Role                                                        | Port  |
|------------|-----------------------|------------------------------------------------------------|-------|
| `backend`  | `node:22-alpine`      | The TanStack Start Node server (SSR pages + server fns)     | 3000  |
| `frontend` | `nginx:1.27-alpine`   | Serves static assets + reverse-proxies SSR/API to `backend` | 8080→80 |
| `db`       | `postgres:16-alpine`  | PostgreSQL with a persistent named volume                   | 5432  |

> The build targets Nitro's **`node-server`** preset (not the default
> Cloudflare Workers target) so it runs as a plain Node server in a container.

---

## Run it

```bash
cp .env.example .env      # fill in the values
docker compose up --build
```

- App via Nginx edge:   http://localhost:8080
- Backend directly:     http://localhost:3000
- Postgres:             localhost:5432

Stop & keep data: `docker compose down`
Stop & wipe the DB volume: `docker compose down -v`

---

## Environment variables

All config is supplied via `.env` (see `.env.example`) — **no secrets are
hardcoded** in the Dockerfiles or compose file.

- `VITE_*` values are **baked into the client bundle at build time**, so they
  are passed as Docker **build args**. Change them → rebuild (`--build`).
- `SUPABASE_*` (no `VITE_` prefix) are read by the backend **at runtime**.
- `POSTGRES_*` configure the bundled Postgres service.

---

## Database & migrations

The SQL migrations in [`supabase/migrations/`](supabase/migrations/) are mounted
into the Postgres container at `/docker-entrypoint-initdb.d`. Postgres runs them
**once, in alphabetical order, only when the data volume is empty** (i.e. first
boot). To re-run them from scratch:

```bash
docker compose down -v && docker compose up --build
```

To apply new migrations to an already-running database, run them manually:

```bash
docker compose exec -T db psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  < supabase/migrations/<new_migration>.sql
```

### Important: Supabase vs. plain Postgres

The application currently connects to **Supabase** (Postgres **plus** Auth and
the PostgREST Data API). The bundled `db` service is **only PostgreSQL**. So:

- To keep using **hosted Supabase**: leave `SUPABASE_URL` /
  `VITE_SUPABASE_URL` pointing at your Supabase project. The `db` service is
  then optional (useful for local DB experiments).
- To fully **self-host the database layer**: run the official Supabase
  self-hosted stack (which adds Auth + PostgREST on top of Postgres) and point
  `SUPABASE_URL` at it, or migrate the app to talk to `DATABASE_URL` directly.
  A bare Postgres container alone cannot serve the app's auth/REST calls.

---

## Deploy to DigitalOcean App Platform (from GitHub, via Docker)

App Platform builds and runs the Docker image directly — you don't set separate
build/start commands, they come from the `Dockerfile`:

- **Build command:** `docker build` of the root `Dockerfile`
  (internally runs `npx vite build --config vite.config.docker.ts`).
- **Start command:** the image `CMD` → `node .output/server/index.mjs`.
- **Port:** App Platform sets `PORT` to `http_port` (3000 here); the server binds to it.

### Steps
1. Make sure the repo is on GitHub (Lovable's GitHub sync pushes automatically
   once connected — Plus (+) menu → GitHub → Connect project).
2. In DigitalOcean → **Apps → Create App → GitHub**, select this repo + branch.
   It auto-detects the `Dockerfile` and [`.do/app.yaml`](.do/app.yaml).
   Or from the CLI: `doctl apps create --spec .do/app.yaml`.
3. Edit [`.do/app.yaml`](.do/app.yaml): set the `github.repo` / `branch`, and the
   `VITE_*` (BUILD_TIME) + `SUPABASE_*` (RUN_TIME) env values. Mark true secrets
   as `type: SECRET`.
4. Deploy. `deploy_on_push: true` redeploys on every push to the branch.

### Database on DigitalOcean
The app uses **Supabase** for DB + Auth + REST, so App Platform just talks to
Supabase over HTTPS — no DB component required. If you'd rather use DO Managed
Postgres, uncomment the `databases:` block in `.do/app.yaml` and run the
migrations in `supabase/migrations/` against it (note: you'd still need an
Auth/REST layer to fully replace Supabase — see the section above).
