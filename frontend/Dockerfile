# =============================================================================
# Frontend edge image (Nginx)
# -----------------------------------------------------------------------------
# Because this app is server-rendered, Nginx is NOT a pure static SPA host here.
# It plays two roles:
#   1. Serve the compiled static client assets (JS/CSS/images) directly & fast.
#   2. Reverse-proxy every dynamic request (SSR HTML, /api, server functions)
#      to the backend Node service — with an SPA-style fallback to the backend
#      so client-side routes still resolve.
#
# Build context is the PROJECT ROOT (see docker-compose `context: .`).
# =============================================================================

# ----- Stage 1: build the static assets -----
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_KEY
ARG VITE_SUPABASE_PROJECT_ID
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY \
    VITE_SUPABASE_PROJECT_ID=$VITE_SUPABASE_PROJECT_ID
# Node-server build; we only take the static client assets (.output/public) for Nginx.
RUN npx vite build --config vite.config.docker.ts

# ----- Stage 2: lightweight Nginx runtime -----
FROM nginx:1.27-alpine AS runtime

# SPA/reverse-proxy config
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Static client assets produced by the Nitro build
COPY --from=build /app/.output/public /usr/share/nginx/html

# Run Nginx as the non-root `nginx` user. The stock image ships this user; we
# just fix up the dirs it needs to write to and switch to it.
RUN touch /var/run/nginx.pid \
 && chown -R nginx:nginx /var/run/nginx.pid /var/cache/nginx /usr/share/nginx/html
USER nginx

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
