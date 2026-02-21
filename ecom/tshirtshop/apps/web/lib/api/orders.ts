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
  /** Stripe Checkout Session ID when paid via Stripe (PAY-004). */
  stripeSessionId?: string | null;
  /** When order was marked paid (PAY-004). */
  paidAt?: string | null;
  items: OrderItem[];
  createdAt: string;
}

/** Cancel order (ORD-004). Only pending or paid orders can be cancelled. */
export async function cancelOrder(orderId: string): Promise<Order | null> {
  if (!orderId?.trim()) return null;
  try {
    const res = await fetch(
      `${apiBase()}/api/v1/orders/${encodeURIComponent(orderId.trim())}/cancel`,
      { method: "POST" },
    );
    if (!res.ok) return null;
    const json = (await res.json()) as { success: boolean; data: Order | null };
    return json.success ? json.data : null;
  } catch {
    return null;
  }
}

/** List my orders (UI-006). Requires authentication. Returns null if API unreachable. */
export async function fetchMyOrders(): Promise<Order[] | null> {
  try {
    const res = await fetch(`${apiBase()}/api/v1/orders`, {
      credentials: "include",
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { success: boolean; data: Order[] };
    return json.success ? json.data : null;
  } catch {
    return null;
  }
}

/** Fetch order by ID. Returns null if not found or API unreachable. */
export async function fetchOrder(orderId: string): Promise<Order | null> {
  if (!orderId?.trim()) return null;
  try {
    const res = await fetch(`${apiBase()}/api/v1/orders/${encodeURIComponent(orderId.trim())}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { success: boolean; data: Order | null };
    return json.success ? json.data : null;
  } catch {
    return null;
  }
}
