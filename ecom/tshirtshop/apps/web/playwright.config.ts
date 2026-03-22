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
 * Sign-up E2E: by default clear NEXT_PUBLIC_RECAPTCHA_SITEKEY unless E2E_KEEP_RECAPTCHA=1.
 * If E2E_RECAPTCHA_SITEKEY is set (e.g. Google's test site key when the backend uses
 * Google's test secret), apply it so the widget can run in automation.
 */
if (process.env.E2E_KEEP_RECAPTCHA !== "1") {
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
        reuseExistingServer: true,
        timeout: 180_000,
        ignoreHTTPSErrors: true,
        env: {
          ...process.env,
          // Non-interactive Turbo (avoid TUI blocking Playwright).
          TURBO_UI: "0",
          // Let registration E2E run without a CAPTCHA widget when Playwright starts dev.
          ...(process.env.E2E_KEEP_RECAPTCHA === "1"
            ? {}
            : process.env.NEXT_PUBLIC_RECAPTCHA_SITEKEY
              ? {
                  NEXT_PUBLIC_RECAPTCHA_SITEKEY:
                    process.env.NEXT_PUBLIC_RECAPTCHA_SITEKEY,
                }
              : { NEXT_PUBLIC_RECAPTCHA_SITEKEY: "" }),
        },
      },
});
