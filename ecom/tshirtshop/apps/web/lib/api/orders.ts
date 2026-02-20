/**
 * Orders API client. Fetch order by ID (CHK-004).
 */

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

/** Fetch order by ID. Works from server or client. */
export async function fetchOrder(orderId: string): Promise<Order | null> {
  if (!orderId?.trim()) return null;
  const res = await fetch(`${apiBase()}/api/v1/orders/${encodeURIComponent(orderId.trim())}`, {
    cache: "no-store",
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { success: boolean; data: Order | null };
  return json.success ? json.data : null;
}
