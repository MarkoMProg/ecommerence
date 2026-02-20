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

/** Create order from cart. Requires shipping address. Call from client only. */
export async function createOrder(shippingAddress: ShippingAddress): Promise<Order> {
  const cartId = getCartIdClient();
  if (!cartId) throw new Error("No cart");

  const res = await fetch(`${apiBase()}/api/v1/checkout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Cart-Id": cartId,
    },
    body: JSON.stringify({ shippingAddress }),
  });

  if (!res.ok) {
    const body = await res.json();
    const err = body?.error;
    const msg = err?.message ?? "Failed to create order";
    const details = err?.details;
    throw new Error(details?.length ? `${msg}: ${JSON.stringify(details)}` : msg);
  }

  const json = (await res.json()) as { success: boolean; data: Order };
  if (!json.success || !json.data) throw new Error("Invalid response from checkout API");
  return json.data;
}
