/**
 * Admin API client. All requests require authentication + admin role.
 * Uses credentials: "include" for session cookie.
 */

function apiBase(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return process.env.API_URL || "http://127.0.0.1:3000";
}

const adminFetch = async (path: string, init?: RequestInit): Promise<Response> => {
  return fetch(`${apiBase()}${path}`, {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
};

export interface AdminOrder {
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
  items: { id: string; productId: string; quantity: number; priceCentsAtOrder: number; productNameAtOrder: string }[];
  createdAt: string;
}

/** ApiProduct shape from catalog API */
export interface AdminProduct {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  stockQuantity: number;
  categoryId: string;
  brand: string;
  images: { id: string; productId: string; imageUrl: string; isPrimary: boolean }[];
  category: { id: string; name: string; slug: string } | null;
}

/** Fetch product list for admin. GET is public. */
export async function fetchAdminProducts(): Promise<AdminProduct[] | null> {
  try {
    const res = await adminFetch("/api/v1/products?limit=500");
    if (!res.ok) return null;
    const json = (await res.json()) as { success: boolean; data: AdminProduct[] };
    return json.success ? json.data : null;
  } catch {
    return null;
  }
}

/** Fetch single product for admin. */
export async function fetchAdminProduct(id: string): Promise<AdminProduct | null> {
  try {
    const res = await adminFetch(`/api/v1/products/${encodeURIComponent(id)}`);
    if (!res.ok) return null;
    const json = (await res.json()) as { success: boolean; data: AdminProduct };
    return json.success ? json.data : null;
  } catch {
    return null;
  }
}

/** Check admin access. Returns true if 200, false if 403. */
export async function checkAdminAccess(): Promise<boolean> {
  try {
    const res = await adminFetch("/api/v1/admin/dashboard");
    return res.ok;
  } catch {
    return false;
  }
}

/** List all orders. Returns null if not admin or API unreachable. */
export async function fetchAdminOrders(): Promise<AdminOrder[] | null> {
  try {
    const res = await adminFetch("/api/v1/admin/orders");
    if (!res.ok) return null;
    const json = (await res.json()) as { success: boolean; data: AdminOrder[] };
    return json.success ? json.data : null;
  } catch {
    return null;
  }
}

/** Create product (admin). Returns null on failure. */
export async function adminCreateProduct(body: {
  name: string;
  description: string;
  priceCents: number;
  stockQuantity?: number;
  categoryId: string;
  brand: string;
  imageUrls?: string[];
}): Promise<unknown | null> {
  try {
    const res = await adminFetch("/api/v1/products", {
      method: "POST",
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { success: boolean; data: unknown };
    return json.success ? json.data : null;
  } catch {
    return null;
  }
}

/** Update product (admin). Returns null on failure. */
export async function adminUpdateProduct(
  id: string,
  body: Record<string, unknown>
): Promise<unknown | null> {
  try {
    const res = await adminFetch(`/api/v1/products/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { success: boolean; data: unknown };
    return json.success ? json.data : null;
  } catch {
    return null;
  }
}

/** Delete product (admin). Returns true on success. */
export async function adminDeleteProduct(id: string): Promise<boolean> {
  try {
    const res = await adminFetch(`/api/v1/products/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Update order status (admin). Returns null on failure. */
export async function adminUpdateOrderStatus(
  orderId: string,
  status: string
): Promise<AdminOrder | null> {
  if (!orderId?.trim() || !status?.trim()) return null;
  try {
    const res = await adminFetch(
      `/api/v1/admin/orders/${encodeURIComponent(orderId.trim())}/status`,
      { method: "PATCH", body: JSON.stringify({ status: status.trim() }) }
    );
    if (!res.ok) return null;
    const json = (await res.json()) as { success: boolean; data: AdminOrder };
    return json.success ? json.data : null;
  } catch {
    return null;
  }
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  twoFactorEnabled: boolean | null;
  createdAt: string;
  orderCount: number;
}

export interface AdminUserDetail extends AdminUser {
  image: string | null;
  updatedAt: string;
}

/** List users (ADM-004). Returns null if not admin. */
export async function fetchAdminUsers(opts?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<{ data: AdminUser[]; pagination: { page: number; limit: number; total: number } } | null> {
  try {
    const params = new URLSearchParams();
    if (opts?.page != null) params.set("page", String(opts.page));
    if (opts?.limit != null) params.set("limit", String(opts.limit));
    if (opts?.search?.trim()) params.set("search", opts.search.trim());
    const qs = params.toString();
    const res = await adminFetch(`/api/v1/admin/users${qs ? `?${qs}` : ""}`);
    if (!res.ok) return null;
    const json = (await res.json()) as {
      success: boolean;
      data: AdminUser[];
      pagination: { page: number; limit: number; total: number };
    };
    return json.success ? { data: json.data, pagination: json.pagination } : null;
  } catch {
    return null;
  }
}

/** Get user by ID (ADM-004). */
export async function fetchAdminUser(userId: string): Promise<AdminUserDetail | null> {
  if (!userId?.trim()) return null;
  try {
    const res = await adminFetch(`/api/v1/admin/users/${encodeURIComponent(userId.trim())}`);
    if (!res.ok) return null;
    const json = (await res.json()) as { success: boolean; data: AdminUserDetail };
    return json.success ? json.data : null;
  } catch {
    return null;
  }
}

/** Refund order (ORD-005). Only paid/shipped/completed. Returns null on failure. */
export async function adminRefundOrder(orderId: string): Promise<AdminOrder | null> {
  if (!orderId?.trim()) return null;
  try {
    const res = await adminFetch(
      `/api/v1/admin/orders/${encodeURIComponent(orderId.trim())}/refund`,
      { method: "POST" }
    );
    if (!res.ok) return null;
    const json = (await res.json()) as { success: boolean; data: AdminOrder };
    return json.success ? json.data : null;
  } catch {
    return null;
  }
}
