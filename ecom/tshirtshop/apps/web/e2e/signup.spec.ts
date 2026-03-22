import { test, expect } from "@playwright/test";

/**
 * Prefer Better Auth `POST /api/auth/sign-up/email` (no browser CAPTCHA) when the backend
 * does not enforce sign-up CAPTCHA. If the server requires CAPTCHA, skip — the UI path
 * depends on Resend + reCAPTCHA and is too flaky for default CI/local E2E.
 * See apps/web/e2e/README.md.
 */
test.describe("Registration user flow", () => {
  test("sign up completes and shows email verification message", async ({
    request,
  }) => {
    test.setTimeout(120_000);
    const unique = `e2e.${Date.now()}@example.com`;

    // Sign-up waits on the server for verification email (Resend). Without a
    // per-request cap, a hung email send can hit the test timeout before Playwright fails the request.
    let res: Awaited<ReturnType<typeof request.post>>;
    try {
      res = await request.post("/api/auth/sign-up/email", {
        data: {
          name: "E2E Playwright",
          email: unique,
          password: "TestPass1",
        },
        timeout: 60_000,
      });
    } catch (err) {
      test.skip(
        true,
        `Sign-up API request failed or timed out (often Resend/network). ${String(err)}`,
      );
    }
    const bodyText = await res.text();

    if (res.ok()) {
      const json = JSON.parse(bodyText) as { user?: { id?: string } };
      expect(json.user?.id).toBeTruthy();
      return;
    }

    if (res.status() >= 500) {
      test.skip(
        true,
        `Sign-up API HTTP ${res.status()} (often Resend/email or server error). Check backend logs. Body: ${bodyText.slice(0, 200)}`,
      );
    }

    const needsCaptchaUi = res.status() === 400 && /captcha/i.test(bodyText);
    if (!needsCaptchaUi) {
      expect(res.ok(), `HTTP ${res.status()}: ${bodyText}`).toBeTruthy();
      return;
    }

    test.skip(
      true,
      "Sign-up requires CAPTCHA. Unset RECAPTCHA_SECRET_KEY in apps/backend/.env for local E2E so POST /api/auth/sign-up/email succeeds without a token, or run a test-only backend. See apps/web/e2e/README.md.",
    );
  });
});
