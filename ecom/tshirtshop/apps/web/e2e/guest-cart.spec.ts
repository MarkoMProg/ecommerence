import { test, expect } from "@playwright/test";
import {
  openFirstProductForE2E,
  selectSizeIfRequired,
  waitForCartItemAdded,
} from "./helpers";

test.describe("Guest cart flow", () => {
  test("add product to cart and see cart page", async ({ page }) => {
    await openFirstProductForE2E(page);
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 30_000 });
    await selectSizeIfRequired(page);

    const added = waitForCartItemAdded(page);
    await page.getByRole("button", { name: /Add to Cart/i }).click();
    await added;

    await page.goto("/cart");
    await expect(page.getByRole("heading", { name: /Cart/i })).toBeVisible();
    await expect(page.getByText(/\$\d+\.\d{2}/).first()).toBeVisible();
  });
});
