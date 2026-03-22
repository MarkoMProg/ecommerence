import { test, expect } from "@playwright/test";
import { e2eUserCredentials } from "./helpers";

test.describe("Better Auth session", () => {
  test.beforeEach(async ({ page }) => {
    const creds = e2eUserCredentials();
    test.skip(
      !creds,
      "Set E2E_USER_EMAIL and E2E_USER_PASSWORD (verified user, no 2FA) in apps/web/.env.local or CI.",
    );
    const res = await page.request.post("/api/auth/sign-in/email", {
      data: { email: creds!.email, password: creds!.password },
    });
    if (!res.ok()) {
      throw new Error(`Sign-in failed: ${res.status()} ${await res.text()}`);
    }
  });

  test("home shows Account link", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: "Account" })).toBeVisible({
      timeout: 30_000,
    });
  });
});
