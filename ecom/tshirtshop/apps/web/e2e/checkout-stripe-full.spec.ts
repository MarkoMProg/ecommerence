import { test, expect } from "@playwright/test";
import {
  guestCheckoutThroughPlaceOrder,
  fillStripePaymentElementTestCard,
} from "./helpers";

const stripeFullEnabled = process.env.E2E_FULL_STRIPE_CHECKOUT === "1";

test.describe("Checkout — Stripe Elements full payment (opt-in)", () => {
  test("guest places order and pays with test card 4242…", async ({ page }) => {
    test.skip(
      !stripeFullEnabled,
      "Opt-in: run `npm run test:e2e:stripe-full` (sets E2E_FULL_STRIPE_CHECKOUT=1). Requires Stripe test keys and no E2E_SKIP_STRIPE_CHECKOUT in backend .env.",
    );
    test.setTimeout(180_000);

    const postRes = await guestCheckoutThroughPlaceOrder(page);
    const postBody = await postRes.text();
    expect(
      postRes.ok(),
      `POST /api/v1/checkout → ${postRes.status()} ${postBody.slice(0, 500)}`,
    ).toBeTruthy();

    const json = JSON.parse(postBody) as {
      data?: { clientSecret?: string | null };
    };
    if (!json?.data?.clientSecret) {
      throw new Error(
        "Expected clientSecret in full-Stripe mode. Remove E2E_SKIP_STRIPE_CHECKOUT from apps/backend/.env, set STRIPE_SECRET_KEY (sk_test_…) and NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (pk_test_…), then restart the dev server.",
      );
    }

    await Promise.race([
      page.waitForURL(/\/checkout\/confirmation(\?|$)/, { timeout: 15_000 }),
      page
        .getByRole("heading", { name: /Complete payment/i })
        .waitFor({ state: "visible", timeout: 60_000 }),
    ]);

    if (page.url().includes("/checkout/confirmation")) {
      throw new Error(
        "Redirected to confirmation without showing Payment Element — backend likely still has E2E_SKIP_STRIPE_CHECKOUT=1 in apps/backend/.env.",
      );
    }

    await fillStripePaymentElementTestCard(page);
    await page.getByRole("button", { name: /Pay now/i }).click();

    await page.waitForURL(/\/checkout\/confirmation/, { timeout: 120_000 });
    await expect(
      page.getByText("Order Confirmation", { exact: true }),
    ).toBeVisible({ timeout: 30_000 });
  });
});
