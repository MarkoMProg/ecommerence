import { test, expect } from "@playwright/test";
import { openFirstProductInCategory } from "./helpers";

test.describe("Guest cart flow", () => {
  test("add poster to cart and see cart page", async ({ page }) => {
    await page.goto("/shop?category=posters");
    if ((await page.locator("a.group.block").count()) === 0) {
      test.skip(true, "No poster products — seed the catalog or run bulk import.");
    }

    await openFirstProductInCategory(page, "posters");
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 30_000 });

    await page.getByRole("button", { name: /Add to Cart/i }).click();
    await expect(page.getByText("Added", { exact: true })).toBeVisible({
      timeout: 15_000,
    });

    await page.goto("/cart");
    await expect(page.getByRole("heading", { name: /Cart/i })).toBeVisible();
    await expect(page.getByText(/\$\d+\.\d{2}/).first()).toBeVisible();
  });
});
