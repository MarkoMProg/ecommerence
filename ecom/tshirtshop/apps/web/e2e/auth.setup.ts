import { test as setup } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { e2eUserCredentials } from "./helpers";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Written for the `chromium-authenticated` project (see playwright.config.ts). */
export const authStoragePath = path.join(__dirname, ".auth", "user.json");

/**
 * Same outcome as [cookie storage state in Playwright](https://nelsonlai.dev/blog/e2e-testing-with-better-auth):
 * persist Better Auth cookies so tests skip the login form.
 *
 * We use POST /api/auth/sign-in/email instead of hand-rolled HMAC + SQL because this app
 * stores blinded/encrypted emails — credentials must go through Better Auth.
 */
setup("authenticate", async ({ request }) => {
  const creds = e2eUserCredentials();
  setup.skip(
    !creds,
    "Set E2E_USER_EMAIL and E2E_USER_PASSWORD (account without 2FA).",
  );

  const res = await request.post("/api/auth/sign-in/email", {
    data: { email: creds!.email, password: creds!.password },
  });
  if (!res.ok()) {
    throw new Error(`Auth setup failed: ${res.status()} ${await res.text()}`);
  }

  await request.storageState({ path: authStoragePath });
});
