/**
 * Checkout API client. Creates order from cart.
 */

import { getCartIdClient } from "../cart-cookie";

function apiBase(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return process.env.API_URL || "http://127.0.0.1:3000";
}

export interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  priceCentsAtOrder: number;
  productNameAtOrder: string;
}

export interface Order {
  id: string;
  userId: string | null;
  status: string;
  shippingFullName: string;
  shippingLine1: string;
  shippingLine2: string | null;
  shippingCity: string;
  shippingStateOrProvince: string;
  shippingPostalCode: string;
  shippingCountry: string;
  shippingPhone: string | null;
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  items: OrderItem[];
  createdAt: string;
}

export interface ShippingAddress {
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  stateOrProvince: string;
  postalCode: string;
  country: string;
  phone?: string;
}

export interface CreateOrderResponse {
  order: Order;
  checkoutUrl: string | null;
}

/** Create order from cart. Pass cartId (e.g. cart.id) or omit to use cookie. Call from client only. */
export async function createOrder(
  shippingAddress: ShippingAddress,
  cartId?: string | null
): Promise<CreateOrderResponse> {
  const id = cartId ?? getCartIdClient();
  if (!id?.trim()) throw new Error("No cart");

  const res = await fetch(`${apiBase()}/api/v1/checkout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Cart-Id": id,
    },
    credentials: "include",
    body: JSON.stringify({ shippingAddress }),
  });

  if (!res.ok) {
    const body = await res.json();
    const err = body?.error;
    const msg = err?.message ?? "Failed to create order";
    const details = err?.details;
    throw new Error(details?.length ? `${msg}: ${JSON.stringify(details)}` : msg);
  }

  const json = (await res.json()) as { success: boolean; data: { order: Order; checkoutUrl: string | null } };
  if (!json.success || !json.data?.order) throw new Error("Invalid response from checkout API");
  return json.data;
}

/** Verify Stripe payment and mark order as paid. Call after user returns from Stripe Checkout. */
export async function verifyPayment(
  sessionId: string,
  orderId?: string
): Promise<Order> {
  const res = await fetch(`${apiBase()}/api/v1/checkout/verify-payment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ session_id: sessionId, orderId: orderId ?? undefined }),
  });

  if (!res.ok) {
    const body = await res.json();
    const err = body?.error;
    const msg = err?.message ?? "Failed to verify payment";
    throw new Error(msg);
  }

  const json = (await res.json()) as { success: boolean; data: Order };
  if (!json.success || !json.data) throw new Error("Invalid response from verify-payment API");
  return json.data;
}
