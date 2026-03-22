import { test, expect } from "@playwright/test";
import { waitForRecaptchaTokenIfPresent } from "./helpers";

/**
 * Prefer Better Auth `POST /api/auth/sign-up/email` (no browser CAPTCHA) when the backend
 * does not enforce sign-up CAPTCHA. If the server returns a CAPTCHA error, fall back to
 * the same UI flow users see (reCAPTCHA widget). See e2e/README.md.
 */
test.describe("Registration user flow", () => {
  test("sign up completes and shows email verification message", async ({
    page,
    request,
  }) => {
    test.setTimeout(120_000);
    const unique = `e2e.${Date.now()}@example.com`;

    const res = await request.post("/api/auth/sign-up/email", {
      data: {
        name: "E2E Playwright",
        email: unique,
        password: "TestPass1",
      },
    });
    const bodyText = await res.text();

    if (res.ok()) {
      const json = JSON.parse(bodyText) as { user?: { id?: string } };
      expect(json.user?.id).toBeTruthy();
      return;
    }

    const needsCaptchaUi = res.status() === 400 && /captcha/i.test(bodyText);
    if (!needsCaptchaUi) {
      expect(res.ok(), `HTTP ${res.status()}: ${bodyText}`).toBeTruthy();
      return;
    }

    test.skip(
      !process.env.E2E_RECAPTCHA_SITEKEY?.trim(),
      "Backend requires sign-up CAPTCHA. Either unset RECAPTCHA_SECRET_KEY for local E2E, or set E2E_RECAPTCHA_SITEKEY (Google test site key) with the matching test secret on the backend. See apps/web/e2e/README.md.",
    );

    await page.goto("/auth/login");
    await page.getByRole("button", { name: /^Sign Up$/ }).click();

    await page.fill("#signup-name", "E2E Playwright");
    await page.fill("#signup-email", unique);
    await page.fill("#signup-password", "TestPass1");

    await waitForRecaptchaTokenIfPresent(page);

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
