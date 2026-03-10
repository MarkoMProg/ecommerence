"use client";

import { useEffect, useState } from "react";
import { Star, Trash2 } from "lucide-react";
import { fetchAdminReviews, adminDeleteReview, type AdminReview } from "@/lib/api/admin";
import { Button } from "@/components/ui/button";

function StarRating({ rating }: { rating: number }) {
  const filled = Math.max(0, Math.min(5, rating));
  return (
    <span className="flex">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`size-4 ${
            s <= filled
              ? "fill-[#E6C068] text-[#E6C068]"
              : "fill-none text-white/30"
          }`}
        />
      ))}
    </span>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

const PAGE_SIZE = 20;

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<AdminReview[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchAdminReviews({ page, limit: PAGE_SIZE }).then((result) => {
      if (cancelled) return;
      if (result) {
        setReviews(result.data);
        setTotal(result.pagination.total);
      } else {
        setError("Failed to load reviews. Check backend connectivity.");
        setReviews([]);
      }
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [page]);

  const handleDelete = async (id: string) => {
    if (!confirm("Permanently delete this review? This cannot be undone.")) return;
    setDeleting(id);
    const ok = await adminDeleteReview(id);
    if (ok) {
      setReviews((prev) => prev ? prev.filter((r) => r.id !== id) : prev);
      setTotal((t) => Math.max(0, t - 1));
    }
    setDeleting(null);
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1
          className="text-2xl font-bold uppercase tracking-tight text-white sm:text-4xl"
          style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
        >
          Review Moderation
        </h1>
        {total > 0 && (
          <p className="text-sm text-white/50">
            {total} review{total !== 1 ? "s" : ""} total
          </p>
        )}
      </div>

      {error && (
        <p className="mb-6 rounded border border-red-500/50 bg-red-500/10 px-4 py-2 text-sm text-red-200">
          {error}
        </p>
      )}

      {loading ? (
        <p className="py-8 text-white/60">Loading reviews…</p>
      ) : !reviews || reviews.length === 0 ? (
        <p className="py-8 text-white/60">No reviews yet.</p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-white/10">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="border-b border-white/10 bg-white/5">
                <tr>
                  <th className="px-4 py-3 font-medium text-white">Rating</th>
                  <th className="px-4 py-3 font-medium text-white">Reviewer</th>
                  <th className="px-4 py-3 font-medium text-white">Product</th>
                  <th className="px-4 py-3 font-medium text-white">Review</th>
                  <th className="px-4 py-3 font-medium text-white">Helpful</th>
                  <th className="px-4 py-3 font-medium text-white">Date</th>
                  <th className="px-4 py-3 font-medium text-white">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {reviews.map((r) => (
                  <tr key={r.id} className="bg-[#1A1A1A]/50 align-top">
                    <td className="px-4 py-3">
                      <StarRating rating={r.rating} />
                    </td>
                    <td className="px-4 py-3 text-white/80">{r.userName}</td>
                    <td className="px-4 py-3 font-mono text-xs text-white/50">
                      {r.productId.slice(0, 8)}…
                    </td>
                    <td className="max-w-xs px-4 py-3">
                      {r.title && (
                        <p className="mb-1 font-medium text-white">{r.title}</p>
                      )}
                      <p className="line-clamp-3 text-white/70">{r.body}</p>
                    </td>
                    <td className="px-4 py-3 text-white/60">{r.helpfulCount}</td>
                    <td className="px-4 py-3 text-white/60">{formatDate(r.createdAt)}</td>
                    <td className="px-4 py-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(r.id)}
                        disabled={deleting === r.id}
                        className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                      >
                        {deleting === r.id ? (
                          "…"
                        ) : (
                          <Trash2 className="size-4" />
                        )}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center gap-4 text-sm text-white/60">
              <span>
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="border-white/20 disabled:opacity-50"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="border-white/20 disabled:opacity-50"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}
