import { defineConfig, devices } from "@playwright/test";
import path from "node:path";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Load apps/web/.env.local so Playwright sees E2E_USER_* and other vars. */
function loadEnvLocal(): void {
  const envPath = path.join(__dirname, ".env.local");
  if (!existsSync(envPath)) return;
  const raw = readFileSync(envPath, "utf8");
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (key && process.env[key] === undefined) process.env[key] = val;
  }
}

loadEnvLocal();

/**
 * reCAPTCHA: preserve NEXT_PUBLIC_RECAPTCHA_SITEKEY from .env.local unless explicitly
 * stripped (E2E_STRIP_RECAPTCHA=1) or overridden (E2E_RECAPTCHA_SITEKEY / E2E_KEEP_RECAPTCHA).
 */
if (process.env.E2E_KEEP_RECAPTCHA === "1") {
  // keep .env.local as loaded
} else if (process.env.E2E_STRIP_RECAPTCHA === "1") {
  delete process.env.NEXT_PUBLIC_RECAPTCHA_SITEKEY;
  const e2eRecaptcha = process.env.E2E_RECAPTCHA_SITEKEY?.trim();
  if (e2eRecaptcha) {
    process.env.NEXT_PUBLIC_RECAPTCHA_SITEKEY = e2eRecaptcha;
  }
}

/** Monorepo root: ecom/tshirtshop (contains apps/web, apps/backend). */
const monorepoRoot = path.resolve(__dirname, "..", "..");

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "https://localhost:3001";

/**
 * Set PLAYWRIGHT_SKIP_WEBSERVER=1 if you already run `npm run dev` from the monorepo root.
 * CI can start servers automatically via webServer below.
 */
const skipWebServer = process.env.PLAYWRIGHT_SKIP_WEBSERVER === "1";

/** When "1", do not force E2E_SKIP_STRIPE_CHECKOUT — use with `npm run test:e2e:stripe-full` + test keys. */
const stripeFullMode = process.env.E2E_FULL_STRIPE_CHECKOUT === "1";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 3,
  reporter: process.env.CI ? "github" : [["html", { open: "never" }]],
  timeout: 60_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL,
    ignoreHTTPSErrors: true,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: process.env.CI ? "retain-on-failure" : "off",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: skipWebServer
    ? undefined
    : {
        command: "npm run dev",
        cwd: monorepoRoot,
        url: baseURL,
        // Reuse dev on 3001 if already running. Set E2E_SKIP_STRIPE_CHECKOUT=1 in apps/backend/.env
        // so guest checkout E2E skips Stripe session creation (see .env.example).
        reuseExistingServer: true,
        timeout: 180_000,
        ignoreHTTPSErrors: true,
        env: {
          ...process.env,
          // Non-interactive Turbo (avoid TUI blocking Playwright).
          TURBO_UI: "0",
          // Guest E2E: skip PaymentIntent unless running full Stripe flow (test:e2e:stripe-full).
          ...(stripeFullMode
            ? {}
            : { E2E_SKIP_STRIPE_CHECKOUT: "1" }),
          ...(process.env.E2E_KEEP_RECAPTCHA === "1"
            ? {}
            : process.env.E2E_STRIP_RECAPTCHA === "1"
              ? process.env.NEXT_PUBLIC_RECAPTCHA_SITEKEY
                ? {
                    NEXT_PUBLIC_RECAPTCHA_SITEKEY:
                      process.env.NEXT_PUBLIC_RECAPTCHA_SITEKEY,
                  }
                : { NEXT_PUBLIC_RECAPTCHA_SITEKEY: "" }
              : {}),
        },
      },
});
