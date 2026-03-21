import { test, expect } from "@playwright/test";

test.describe("Catalog", () => {
  test("shop lists categories and products or empty state", async ({ page }) => {
    await page.goto("/shop");
    await expect(
      page.getByRole("heading", { name: /All Items|Search:/i }),
    ).toBeVisible({ timeout: 30_000 });
    const hasProducts = await page.locator("a.group.block").count();
    if (hasProducts === 0) {
      await expect(
        page.getByText(
          /Catalog API unreachable|No products in this category|No products found/i,
        ),
      ).toBeVisible();
    }
  });

  test("search query is reflected in heading", async ({ page }) => {
    await page.goto("/shop?q=dice");
    await expect(page.getByRole("heading", { name: /Search:.*dice/i })).toBeVisible({
      timeout: 30_000,
    });
  });
});
