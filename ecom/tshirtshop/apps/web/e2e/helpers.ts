import type { Page } from "@playwright/test";

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
