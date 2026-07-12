# =============================================================================
# Backend / App image  (TanStack Start = SSR frontend + server-function backend)
# -----------------------------------------------------------------------------
# This project is a SINGLE unified full-stack app: one Node process serves both
# the server-rendered frontend AND the backend server functions. We build it
# with Nitro's `node-server` preset so it produces a plain Node server
# (`.output/server/index.mjs`) that runs anywhere — no Cloudflare Workers needed.
# =============================================================================

# ----- Stage 1: build -----
FROM oven/bun:1-alpine AS build
WORKDIR /app

# Install ALL deps (incl. dev) from the Bun lockfile Lovable keeps in sync
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Copy source and build.
# VITE_* vars are baked into the client bundle at build time, so they must be
# present here (passed as build args from docker-compose).
COPY . .
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_KEY
ARG VITE_SUPABASE_PROJECT_ID
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY \
    VITE_SUPABASE_PROJECT_ID=$VITE_SUPABASE_PROJECT_ID
# Uses vite.config.docker.ts to emit the standalone Node-server output
# (.output/) instead of the default Cloudflare Workers target.
RUN bunx vite build --config vite.config.docker.ts

# ----- Stage 2: slim runtime -----
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000

# The Nitro node-server output in `.output` is fully self-contained (deps are
# bundled), so we only copy that — the final image stays small and has no
# node_modules / source tree.
COPY --from=build /app/.output ./.output

# Run as the built-in non-root `node` user
USER node

EXPOSE 3000

# Healthcheck honours the runtime PORT (DigitalOcean App Platform injects its own).
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider "http://127.0.0.1:${PORT:-3000}/" || exit 1

CMD ["node", ".output/server/index.mjs"]
