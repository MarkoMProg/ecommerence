import { test, expect } from "@playwright/test";

test.describe("Better Auth session (storage state)", () => {
  test("home shows Account when session cookie is injected", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: "Account" })).toBeVisible({
      timeout: 30_000,
    });
  });
});
