import "dotenv/config";
import { defineConfig } from "@playwright/test";

const PORT = 3100;

export default defineConfig({
  testDir: "./tests/e2e",
  // One worker: specs create/consume real Postgres rows and a real admin
  // account keyed off a fixed ADMIN_EMAIL — parallel workers would race on
  // that account and on shared "no meals yet" assumptions.
  workers: 1,
  use: {
    baseURL: `http://localhost:${PORT}`,
  },
  webServer: {
    // A dedicated port, distinct from the usual `npm run dev` (3000), so
    // e2e runs never collide with a manually-running dev server.
    command: `npm run dev -- -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      // Fixed admin-bootstrap email so tests/e2e/core-flow.spec.ts can
      // register it and get real ADMIN access without touching prod-style
      // .env state.
      ADMIN_EMAIL: "e2e-admin@example.com",
    },
  },
});
