import { test, expect } from "@playwright/test";

/**
 * When NEXT_PUBLIC_RECAPTCHA_SITEKEY is unset, registration does not require CAPTCHA.
 * Run with: `NEXT_PUBLIC_RECAPTCHA_SITEKEY=` or omit from .env.local for local E2E.
 */
test.describe("Registration user flow", () => {
  test("sign up completes and shows email verification message", async ({
    page,
  }) => {
    test.skip(
      !!process.env.NEXT_PUBLIC_RECAPTCHA_SITEKEY,
      "Unset NEXT_PUBLIC_RECAPTCHA_SITEKEY for this test (no CAPTCHA in CI/E2E).",
    );

    const unique = `e2e.${Date.now()}@example.com`;

    await page.goto("/auth/login");
    await page.getByRole("button", { name: /^Sign Up$/ }).click();

    await page.fill("#signup-name", "E2E Playwright");
    await page.fill("#signup-email", unique);
    await page.fill("#signup-password", "TestPass1");

    await page
      .locator("form")
      .filter({ has: page.locator("#signup-email") })
      .getByRole("button", { name: /^Sign Up$/ })
      .click();

    await expect(page.getByRole("heading", { name: /Check Your Email/i })).toBeVisible({
      timeout: 30_000,
    });
  });
});
