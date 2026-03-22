import { test, expect } from "@playwright/test";
import { openFirstProductForE2E, selectSizeIfRequired } from "./helpers";

test.describe("Guest cart flow", () => {
  test("add product to cart and see cart page", async ({ page }) => {
    await openFirstProductForE2E(page);
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 30_000 });
    await selectSizeIfRequired(page);

    await page.getByRole("button", { name: /Add to Cart/i }).click();
    await expect(
      page.getByRole("button", { name: /Added/i }).first(),
    ).toBeVisible({
      timeout: 15_000,
    });

    await page.goto("/cart");
    await expect(page.getByRole("heading", { name: /Cart/i })).toBeVisible();
    await expect(page.getByText(/\$\d+\.\d{2}/).first()).toBeVisible();
  });
});
