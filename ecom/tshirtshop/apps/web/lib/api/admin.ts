/**
 * Admin API client.
 *
 * User management (list, ban, role, create, remove, impersonate) is now
 * handled entirely by Better Auth admin plugin client (authClient.admin.*).
 *
 * This file only contains helpers for business-specific admin operations
 * (orders, products) that Better Auth does not cover.
 *
 * All requests require authentication + admin role.
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
  /** Stripe Checkout Session ID when paid via Stripe (PAY-004). */
  stripeSessionId?: string | null;
  /** When order was marked paid (PAY-004). */
  paidAt?: string | null;
  items: { id: string; productId: string; quantity: number; priceCentsAtOrder: number; productNameAtOrder: string }[];
  createdAt: string;
}

/** ApiProduct shape from catalog API */
export interface AdminProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  priceCents: number;
  stockQuantity: number;
  categoryId: string;
  brand: string;
  weightMetric?: string | null;
  weightImperial?: string | null;
  dimensionMetric?: string | null;
  dimensionImperial?: string | null;
  images: { id: string; productId: string; imageUrl: string; altText: string | null; isPrimary: boolean }[];
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

/** Shared image input type: url + optional alt text. */
export interface ProductImageInput {
  url: string;
}

/**
 * Upload a product image file to the backend.
 * Returns the hosted URL on success, or null on failure.
 */
export async function adminUploadImage(file: File): Promise<string | null> {
  try {
    const form = new FormData();
    form.append("file", file);
    // Do NOT set Content-Type — the browser sets it with the correct boundary.
    const res = await fetch(`${apiBase()}/api/v1/uploads`, {
      method: "POST",
      body: form,
      credentials: "include",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { success: boolean; data: { url: string } };
    return json.success ? json.data.url : null;
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
  weightMetric?: string;
  weightImperial?: string;
  dimensionMetric?: string;
  dimensionImperial?: string;
  images?: ProductImageInput[];
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
  body: {
    name?: string;
    description?: string;
    priceCents?: number;
    stockQuantity?: number;
    categoryId?: string;
    brand?: string;
    weightMetric?: string;
    weightImperial?: string;
    dimensionMetric?: string;
    dimensionImperial?: string;
    images?: ProductImageInput[];
  }
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

// ─── Reviews (admin) ────────────────────────────────────────────────────────

export interface AdminReview {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  title: string | null;
  body: string;
  helpfulCount: number;
  createdAt: string;
  updatedAt: string;
}

/** List all reviews (admin). Returns null on error. */
export async function fetchAdminReviews(opts?: {
  page?: number;
  limit?: number;
  productId?: string;
}): Promise<{ data: AdminReview[]; pagination: { page: number; limit: number; total: number } } | null> {
  try {
    const params = new URLSearchParams();
    if (opts?.page != null) params.set("page", String(opts.page));
    if (opts?.limit != null) params.set("limit", String(opts.limit));
    if (opts?.productId) params.set("productId", opts.productId);
    const qs = params.toString();
    const res = await adminFetch(`/api/v1/admin/reviews${qs ? `?${qs}` : ""}`);
    if (!res.ok) return null;
    const json = (await res.json()) as {
      success: boolean;
      data: AdminReview[];
      pagination: { page: number; limit: number; total: number };
    };
    return json.success ? { data: json.data, pagination: json.pagination } : null;
  } catch {
    return null;
  }
}

/** Admin-delete any review (override). Returns true on success. */
export async function adminDeleteReview(reviewId: string): Promise<boolean> {
  if (!reviewId?.trim()) return false;
  try {
    const res = await adminFetch(
      `/api/v1/admin/reviews/${encodeURIComponent(reviewId.trim())}`,
      { method: "DELETE" }
    );
    return res.ok;
  } catch {
    return false;
  }
}

// ─── Bulk Upload ────────────────────────────────────────────────────────────

export interface BulkRowResult {
  row: number;
  name: string;
  status: "created" | "error";
  productId?: string;
  error?: string;
}

export interface BulkUploadResult {
  total: number;
  succeeded: number;
  failed: number;
  results: BulkRowResult[];
}

/**
 * Upload a CSV or JSON file for bulk product creation.
 * Returns the result summary, or null on complete failure.
 */
export async function adminBulkUploadProducts(
  file: File
): Promise<BulkUploadResult | null> {
  try {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${apiBase()}/api/v1/admin/products/bulk`, {
      method: "POST",
      body: form,
      credentials: "include",
    });
    if (!res.ok) {
      // Try to get error message from response
      try {
        const json = (await res.json()) as { error?: { message?: string } };
        throw new Error(json?.error?.message ?? `Upload failed (${res.status})`);
      } catch (parseErr) {
        if (parseErr instanceof Error && parseErr.message !== `Upload failed (${res.status})`) {
          throw parseErr;
        }
        throw new Error(`Upload failed (${res.status})`);
      }
    }
    const json = (await res.json()) as {
      success: boolean;
      data: BulkUploadResult;
    };
    return json.success ? json.data : null;
  } catch (err) {
    throw err;
  }
}
