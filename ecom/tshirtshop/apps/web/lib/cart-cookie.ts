/**
 * Cart ID cookie helpers. 7-day expiry for guest carts.
 * Cookie name: darkloom_cart_id
 */
export const CART_COOKIE = "darkloom_cart_id";
const MAX_AGE_DAYS = 7;

/** Get cart ID from Next.js cookies (server-side). Pass result of cookies() from next/headers. */
export function getCartIdFromCookies(
  cookieStore: { get: (name: string) => { value: string } | undefined },
): string | null {
  const c = cookieStore.get(CART_COOKIE);
  return c?.value ?? null;
}

/** Get cart ID from document.cookie (client-side only) */
export function getCartIdClient(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(^| )${CART_COOKIE}=([^;]+)`));
  return match ? decodeURIComponent(match[2]) : null;
}

/** Set cart ID in cookie (client-side only). Call after add-to-cart returns new cartId. */
export function setCartIdClient(cartId: string): void {
  if (typeof document === "undefined") return;
  const maxAge = MAX_AGE_DAYS * 24 * 60 * 60;
  document.cookie = `${CART_COOKIE}=${encodeURIComponent(cartId)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}
