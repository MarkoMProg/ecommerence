import { test, expect } from "@playwright/test";
import {
  guestCheckoutThroughPlaceOrder,
  waitForCheckoutConfirmationOrPaymentStep,
} from "./helpers";

test.describe("Checkout user flow (guest)", () => {
  test("place order reaches confirmation or Stripe Elements payment step", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    const postRes = await guestCheckoutThroughPlaceOrder(page);
    const postBody = await postRes.text();
    expect(
      postRes.ok(),
      `POST /api/v1/checkout → ${postRes.status()} ${postBody.slice(0, 500)}`,
    ).toBeTruthy();

    await waitForCheckoutConfirmationOrPaymentStep(page, 60_000);

    const onConfirmation = page.url().includes("/checkout/confirmation");
    if (onConfirmation) {
      await expect(page).toHaveURL(/\/checkout\/confirmation/);
    } else {
      await expect(
        page.getByRole("button", { name: /Pay now/i }),
      ).toBeVisible({ timeout: 15_000 });
    }
  });
});
