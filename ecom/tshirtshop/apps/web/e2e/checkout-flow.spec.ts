import { test, expect } from "@playwright/test";
import {
  openFirstProductForE2E,
  selectSizeIfRequired,
  waitForCartItemAdded,
} from "./helpers";

test.describe("Checkout user flow (guest)", () => {
  test("place order navigates to Stripe or confirmation", async ({ page }) => {
    test.setTimeout(120_000);
    await openFirstProductForE2E(page);
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 30_000 });
    await selectSizeIfRequired(page);
    const added = waitForCartItemAdded(page);
    await page.getByRole("button", { name: /Add to Cart/i }).click();
    await added;

    await page.keyboard.press("Escape");
    await page.goto("/checkout", { waitUntil: "load" });
    await page.waitForLoadState("load");

    await expect(page.getByRole("heading", { name: /Checkout/i })).toBeVisible();
    await expect(page.getByText("Your cart is empty")).not.toBeVisible();
    await expect(page.locator("#checkout-form")).toBeVisible();

    // Wait for client hydration so controlled inputs accept fill (avoid empty React state + dead Select).
    await expect(page.locator("#checkout-fullName")).toBeEditable({ timeout: 15_000 });

    await page.fill("#checkout-fullName", "E2E Test User");
    await page.fill("#checkout-line1", "123 Test Street");
    await page.fill("#checkout-city", "Austin");
    await page.fill("#checkout-state", "TX");

    // Country before postal so client validation (US + ZIP) matches React state.
    await page.locator("#checkout-form").getByRole("combobox").click();
    await page.getByRole("option", { name: "United States" }).click();
    await expect(page.locator("#checkout-country")).toContainText(/United States/i);

    await page.fill("#checkout-postal", "78701");
    await page.fill("#checkout-phone", "5551234567");

    await page.getByRole("heading", { name: /Order summary/i }).click();

    const placeBtn = page.getByRole("button", { name: /Place Order/i });
    await expect(placeBtn).toBeEnabled({ timeout: 15_000 });

    const checkoutPost = page.waitForResponse(
      (r) => {
        if (r.request().method() !== "POST") return false;
        try {
          return new URL(r.url()).pathname === "/api/v1/checkout";
        } catch {
          return false;
        }
      },
      { timeout: 60_000 },
    );
    await placeBtn.click();
    const postRes = await checkoutPost;
    const postBody = await postRes.text();
    expect(
      postRes.ok(),
      `POST /api/v1/checkout → ${postRes.status()} ${postBody.slice(0, 500)}`,
    ).toBeTruthy();

    await page.waitForURL(
      /\/checkout\/confirmation|checkout\.stripe\.com|\.stripe\.com\/c\//i,
      { timeout: 60_000 },
    );
  });
});
