/**
 * Runs opt-in Stripe Elements E2E with E2E_FULL_STRIPE_CHECKOUT=1 so Playwright
 * does not inject E2E_SKIP_STRIPE_CHECKOUT for the dev server.
 */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appsWebRoot = join(__dirname, "..");

process.env.E2E_FULL_STRIPE_CHECKOUT = "1";

const result = spawnSync(
  "npx",
  ["playwright", "test", "e2e/checkout-stripe-full.spec.ts"],
  {
    cwd: appsWebRoot,
    stdio: "inherit",
    shell: true,
    env: { ...process.env, E2E_FULL_STRIPE_CHECKOUT: "1" },
  },
);

process.exit(result.status === null ? 1 : result.status);
