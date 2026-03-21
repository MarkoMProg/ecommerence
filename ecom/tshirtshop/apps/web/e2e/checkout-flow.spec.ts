import { test, expect } from "@playwright/test";
import { openFirstProductInCategory } from "./helpers";

test.describe("Checkout user flow (guest)", () => {
  test("place order navigates to Stripe or confirmation", async ({ page }) => {
    await page.goto("/shop?category=posters");
    if ((await page.locator("a.group.block").count()) === 0) {
      test.skip(true, "No poster products in DB.");
    }

    await openFirstProductInCategory(page, "posters");
    await page.getByRole("button", { name: /Add to Cart/i }).click();
    await expect(page.getByText("Added", { exact: true })).toBeVisible({
      timeout: 15_000,
    });

    await page.goto("/checkout");
    await expect(page.getByRole("heading", { name: /Checkout/i })).toBeVisible();
    await expect(page.getByText("Your cart is empty")).not.toBeVisible();

    await page.fill("#checkout-fullName", "E2E Test User");
    await page.fill("#checkout-line1", "123 Test Street");
    await page.fill("#checkout-city", "Austin");
    await page.fill("#checkout-state", "TX");
    await page.fill("#checkout-postal", "78701");

    await page.locator("#checkout-country").click();
    await page.getByRole("option", { name: "United States" }).click();

    await page.fill("#checkout-phone", "+1 555 123 4567");

    const placeBtn = page.getByRole("button", { name: /Place Order/i });
    await expect(placeBtn).toBeEnabled({ timeout: 15_000 });
    await placeBtn.click();

    await expect
      .poll(
        async () => {
          const u = page.url();
          return (
            /checkout\.stripe\.com|stripe\.com/.test(u) ||
            u.includes("/checkout/confirmation")
          );
        },
        { timeout: 60_000 },
      )
      .toBe(true);
  });
});
