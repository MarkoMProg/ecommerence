import { expect, type Page } from "@playwright/test";

/** Open the first product card on the shop listing (expects at least one product). */
export async function openFirstShopProduct(page: Page): Promise<void> {
  await page.goto("/shop");
  const first = page.locator("a.group.block").first();
  await first.waitFor({ state: "visible", timeout: 30_000 });
  await first.click();
}

/** Prefer a category that usually does not require size selection (posters). */
export async function openFirstProductInCategory(
  page: Page,
  categorySlug: string,
): Promise<void> {
  await page.goto(`/shop?category=${encodeURIComponent(categorySlug)}`);
  const first = page.locator("a.group.block").first();
  await first.waitFor({ state: "visible", timeout: 30_000 });
  await first.click();
}

export function e2eUserCredentials(): { email: string; password: string } | null {
  const email = process.env.E2E_USER_EMAIL?.trim();
  const password = process.env.E2E_USER_PASSWORD?.trim();
  if (!email || !password) return null;
  return { email, password };
}

/**
 * Prefer posters (no size pickers); otherwise first product on /shop.
 * Throws if the catalog is empty so the test fails instead of skipping.
 */
export async function openFirstProductForE2E(page: Page): Promise<void> {
  await page.goto("/shop?category=posters", { waitUntil: "load" });
  await page.waitForLoadState("domcontentloaded");

  const firstPoster = page.locator("a.group.block").first();
  try {
    await firstPoster.waitFor({ state: "visible", timeout: 15_000 });
    await firstPoster.click();
    return;
  } catch {
    // Category empty or listing still settling — try full shop.
  }

  await page.goto("/shop", { waitUntil: "load" });
  await page.waitForLoadState("domcontentloaded");

  const firstAny = page.locator("a.group.block").first();
  try {
    await firstAny.waitFor({ state: "visible", timeout: 30_000 });
  } catch {
    throw new Error(
      "E2E needs at least one product — seed the DB (e.g. npm run db:seed in backend).",
    );
  }
  await firstAny.click();
}

/**
 * Resolves when guest/user add-to-cart succeeds. Prefer this over asserting the PDP
 * button text "Added!" — that state only lasts ~1.5s and flakes under load.
 */
export function waitForCartItemAdded(page: Page): Promise<Response> {
  return page.waitForResponse(
    (r) =>
      r.request().method() === "POST" &&
      r.url().includes("/api/v1/cart/items") &&
      r.ok(),
    { timeout: 30_000 },
  );
}

/**
 * After "Place order" succeeds: either redirect to confirmation (no Stripe, or
 * E2E_SKIP_STRIPE_CHECKOUT=1 so PaymentIntent is skipped), or stay on /checkout
 * with Stripe Elements ("Complete payment").
 */
export async function waitForCheckoutConfirmationOrPaymentStep(
  page: Page,
  timeout = 60_000,
): Promise<void> {
  await Promise.race([
    page.waitForURL(/\/checkout\/confirmation(\?|$)/, { timeout }),
    page
      .getByRole("heading", { name: /Complete payment/i })
      .waitFor({ state: "visible", timeout }),
  ]);
}

/**
 * Guest: open first product, add to cart, fill US address on /checkout, click Place Order.
 * Returns the POST /api/v1/checkout response (body not consumed).
 */
export async function guestCheckoutThroughPlaceOrder(page: Page): Promise<Response> {
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

  await expect(page.locator("#checkout-fullName")).toBeEditable({ timeout: 15_000 });

  await page.fill("#checkout-fullName", "E2E Test User");
  await page.fill("#checkout-line1", "123 Test Street");
  await page.fill("#checkout-city", "Austin");
  await page.fill("#checkout-state", "TX");

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
  return await checkoutPost;
}

/**
 * Fill Stripe Payment Element with test card 4242… (see Stripe testing docs).
 * BRITTLE: Depends on Stripe iframe layout; adjust if Stripe.js changes.
 */
export async function fillStripePaymentElementTestCard(page: Page): Promise<void> {
  await page.getByRole("button", { name: /Pay now/i }).waitFor({
    state: "visible",
    timeout: 60_000,
  });

  const cardTab = page.getByRole("tab", { name: /^Card$/i });
  if (await cardTab.isVisible().catch(() => false)) {
    await cardTab.click();
  }

  const secureIframes = page.locator('iframe[title*="Secure payment"]');
  await expect(secureIframes.first()).toBeVisible({ timeout: 45_000 });
  const n = await secureIframes.count();

  if (n >= 3) {
    const f = (i: number) =>
      page.frameLocator('iframe[title*="Secure payment"]').nth(i);
    await f(0).locator("input").first().fill("4242424242424242");
    await f(1).locator("input").first().fill("1234");
    await f(2).locator("input").first().fill("123");
    return;
  }

  if (n === 1) {
    const fl = page.frameLocator('iframe[title*="Secure payment"]').first();
    const inputs = fl.locator("input");
    await expect(inputs.first()).toBeVisible({ timeout: 15_000 });
    const ic = await inputs.count();
    if (ic >= 3) {
      await inputs.nth(0).fill("4242424242424242");
      await inputs.nth(1).fill("1234");
      await inputs.nth(2).fill("123");
      return;
    }
  }

  throw new Error(
    "Could not fill Stripe Payment Element (unexpected iframe layout).",
  );
}

/** Apparel PDPs require a size before Add to Cart runs the mutation. */
export async function selectSizeIfRequired(page: Page): Promise<void> {
  const sizeLabel = page.locator("p").filter({ hasText: /^Size$/i });
  if ((await sizeLabel.count()) === 0) return;
  const row = sizeLabel.locator("..").locator("div.flex.flex-wrap.gap-2 button").first();
  if ((await row.count()) === 0) return;
  await row.click();
}

/**
 * When reCAPTCHA v2 is shown, wait for g-recaptcha-response before submit.
 * Clicks the checkbox iframe if the token does not appear on its own (e.g. some keys).
 * Not used by default signup E2E (see signup.spec.ts); keep for manual/headed flows if needed.
 */
export async function waitForRecaptchaTokenIfPresent(page: Page): Promise<void> {
  const iframe = page.locator('iframe[src*="recaptcha"]').first();
  try {
    await iframe.waitFor({ state: "attached", timeout: 15_000 });
  } catch {
    return;
  }

  const hasToken = () => {
    const t = document.querySelector('textarea[name="g-recaptcha-response"]');
    if (t instanceof HTMLTextAreaElement && t.value.length > 0) return true;
    const w = window as unknown as {
      grecaptcha?: { getResponse: (widgetId?: number) => string };
    };
    const r = w.grecaptcha?.getResponse?.();
    return typeof r === "string" && r.length > 0;
  };

  if (await page.evaluate(hasToken)) return;

  const frame = page.frameLocator('iframe[src*="recaptcha"]').first();
  await frame.locator("#recaptcha-anchor").click({ timeout: 20_000 });

  try {
    await page.waitForFunction(hasToken, { timeout: 45_000 });
  } catch {
    throw new Error(
      "reCAPTCHA did not produce a token in time. If a dev server was already running, stop it so Playwright can start Next with E2E_RECAPTCHA_SITEKEY, or use Google's test site + secret together. See apps/web/e2e/README.md.",
    );
  }
}
