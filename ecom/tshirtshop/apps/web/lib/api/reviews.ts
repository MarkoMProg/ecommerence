/**
 * Reviews API client (REV-002).
 */

function apiBase(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return process.env.API_URL || "http://127.0.0.1:3000";
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  title: string | null;
  body: string;
  createdAt: string;
  updatedAt: string;
  /** REV-004: count of helpful votes */
  helpfulCount: number;
}

export interface ReviewsResponse {
  success: boolean;
  data: Review[];
  pagination: { page: number; limit: number; total: number };
}

/** List reviews for a product. Public. */
export async function fetchProductReviews(
  productId: string,
  opts?: { page?: number; limit?: number }
): Promise<ReviewsResponse | null> {
  if (!productId?.trim()) return null;
  const params = new URLSearchParams();
  if (opts?.page != null) params.set("page", String(opts.page));
  if (opts?.limit != null) params.set("limit", String(opts.limit));
  const qs = params.toString();
  try {
    const res = await fetch(
      `${apiBase()}/api/v1/products/${encodeURIComponent(productId.trim())}/reviews${qs ? `?${qs}` : ""}`
    );
    if (!res.ok) return null;
    const json = (await res.json()) as ReviewsResponse;
    return json.success ? json : null;
  } catch {
    return null;
  }
}

/** Create review. Requires auth (credentials: include). */
export async function createReview(
  productId: string,
  body: { rating: number; title?: string; body: string }
): Promise<Review | null> {
  if (!productId?.trim()) return null;
  try {
    const res = await fetch(
      `${apiBase()}/api/v1/products/${encodeURIComponent(productId.trim())}/reviews`,
      {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );
    if (!res.ok) return null;
    const json = (await res.json()) as { success: boolean; data: Review };
    return json.success ? json.data : null;
  } catch {
    return null;
  }
}

/** Update own review. Requires auth. */
export async function updateReview(
  reviewId: string,
  body: { rating?: number; title?: string; body?: string }
): Promise<Review | null> {
  if (!reviewId?.trim()) return null;
  try {
    const res = await fetch(
      `${apiBase()}/api/v1/reviews/${encodeURIComponent(reviewId.trim())}`,
      {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );
    if (!res.ok) return null;
    const json = (await res.json()) as { success: boolean; data: Review };
    return json.success ? json.data : null;
  } catch {
    return null;
  }
}

/** Vote helpful on a review (REV-004). Requires auth. */
export async function voteReviewHelpful(
  reviewId: string,
  helpful: boolean
): Promise<{ helpfulCount: number } | null> {
  if (!reviewId?.trim()) return null;
  try {
    const res = await fetch(
      `${apiBase()}/api/v1/reviews/${encodeURIComponent(reviewId.trim())}/helpful`,
      {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ helpful }),
      }
    );
    if (!res.ok) return null;
    const json = (await res.json()) as { success: boolean; data: { helpfulCount: number } };
    return json.success ? json.data : null;
  } catch {
    return null;
  }
}

/** Delete own review. Requires auth. */
export async function deleteReview(reviewId: string): Promise<boolean> {
  if (!reviewId?.trim()) return false;
  try {
    const res = await fetch(
      `${apiBase()}/api/v1/reviews/${encodeURIComponent(reviewId.trim())}`,
      { method: "DELETE", credentials: "include" }
    );
    return res.ok;
  } catch {
    return false;
  }
}
