// Docker-only build config. Keeps the main vite.config.ts (used by the Lovable
// preview/deploy, which targets Cloudflare) untouched, and overrides ONLY the
// Nitro preset so `vite build --config vite.config.docker.ts` emits a plain
// Node server (.output/server/index.mjs) that runs in a container.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  nitro: {
    preset: "node-server",
  },
});
