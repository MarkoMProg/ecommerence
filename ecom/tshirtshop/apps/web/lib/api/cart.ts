/**
 * Cart API client. Uses X-Cart-Id header for guest carts; session for user carts (CART-005, CART-006).
 */

import {
  getCartIdClient,
  setCartIdClient,
  clearCartIdClient,
} from "../cart-cookie";

function apiBase(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return process.env.API_URL || "http://127.0.0.1:3000";
}

export interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  productName: string;
  priceCents: number;
  imageUrl: string | null;
}

export interface Cart {
  id: string;
  userId: string | null;
  items: CartItem[];
  itemCount: number;
  totalCents: number;
}

function cartHeaders(cartId: string | null): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (cartId) h["X-Cart-Id"] = cartId;
  return h;
}

/** Fetch cart (server). Uses cartId from cookies; pass cookieHeader for auth. Returns null if unreachable. */
export async function fetchCart(
  cartId: string | null,
  options?: { cookieHeader?: string }
): Promise<Cart | null> {
  if (!cartId?.trim() && !options?.cookieHeader) return null;
  try {
    const headers: Record<string, string> = { ...cartHeaders(cartId) };
    if (options?.cookieHeader) headers["Cookie"] = options.cookieHeader;
    const res = await fetch(`${apiBase()}/api/v1/cart`, {
      headers,
      cache: "no-store",
      credentials: options?.cookieHeader ? "include" : undefined,
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      success: boolean;
      data: Cart | null;
      merged?: boolean;
    };
    return json.success ? json.data : null;
  } catch {
    return null;
  }
}

/** Fetch cart from client. Sends credentials for auth; clears guest cookie when merged. */
export async function fetchCartClient(): Promise<Cart | null> {
  const cartId = getCartIdClient();
  try {
    const res = await fetch(`${apiBase()}/api/v1/cart`, {
      headers: cartHeaders(cartId),
      credentials: "include",
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      success: boolean;
      data: Cart | null;
      merged?: boolean;
    };
    if (json.merged) clearCartIdClient();
    return json.success ? json.data : null;
  } catch {
    return null;
  }
}

export interface AddToCartResult {
  cart: Cart;
  cartId?: string;
  created: boolean;
}

/** Add item to cart. Sends credentials for auth; stores new cartId for guests. Call from client only. */
export async function addToCart(
  productId: string,
  quantity = 1,
): Promise<AddToCartResult> {
  const cartId = getCartIdClient();
  const res = await fetch(`${apiBase()}/api/v1/cart/items`, {
    method: "POST",
    headers: cartHeaders(cartId),
    credentials: "include",
    body: JSON.stringify({ productId, quantity }),
  });
  if (!res.ok) {
    const err = (await res.json()).error;
    throw new Error(err?.message ?? "Failed to add to cart");
  }
  const json = (await res.json()) as {
    success: boolean;
    data: Cart;
    cartId?: string;
  };
  if (json.cartId) setCartIdClient(json.cartId);
  return {
    cart: json.data,
    cartId: json.cartId,
    created: !!json.cartId,
  };
}

/** Remove item from cart. Uses session when logged in; X-Cart-Id for guests. Call from client only. */
export async function removeFromCart(productId: string): Promise<Cart> {
  const cartId = getCartIdClient();
  const res = await fetch(
    `${apiBase()}/api/v1/cart/items/${encodeURIComponent(productId)}`,
    {
      method: "DELETE",
      headers: cartHeaders(cartId),
      credentials: "include",
    },
  );
  if (!res.ok) {
    const err = (await res.json()).error;
    throw new Error(err?.message ?? "Failed to remove item");
  }
  const json = (await res.json()) as { success: boolean; data: Cart };
  return json.data;
}

/** Update item quantity. Quantity 0 removes. Uses session when logged in. Call from client only. */
export async function updateCartItemQuantity(
  productId: string,
  quantity: number,
): Promise<Cart> {
  const cartId = getCartIdClient();
  const res = await fetch(
    `${apiBase()}/api/v1/cart/items/${encodeURIComponent(productId)}`,
    {
      method: "PATCH",
      headers: cartHeaders(cartId),
      credentials: "include",
      body: JSON.stringify({ quantity }),
    },
  );
  if (!res.ok) {
    const err = (await res.json()).error;
    throw new Error(err?.message ?? "Failed to update quantity");
  }
  const json = (await res.json()) as { success: boolean; data: Cart };
  return json.data;
}
