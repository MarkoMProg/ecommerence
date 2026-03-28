import { test, expect } from "@playwright/test";

test.describe("Smoke", () => {
  test("home page loads and links to shop", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /Forged in Shadow/i })).toBeVisible();
    const shopNow = page.getByRole("link", { name: "Shop Now", exact: true });
    await Promise.all([
      page.waitForURL(/\/shop/, { timeout: 30_000 }),
      shopNow.click(),
    ]);
  });

  test("auth page loads", async ({ page }) => {
    await page.goto("/auth/login");
    await expect(
      page
        .locator("form")
        .filter({ has: page.locator("#login-email") })
        .getByRole("button", { name: /^Sign In$/ }),
    ).toBeVisible();
  });

  test("contact page loads", async ({ page }) => {
    await page.goto("/contact");
    await expect(page.getByRole("heading", { name: /Contact/i })).toBeVisible();
  });
});
