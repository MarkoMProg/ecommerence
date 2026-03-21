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
