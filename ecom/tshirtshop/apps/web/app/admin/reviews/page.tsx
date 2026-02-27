"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

/**
 * Admin Reviews Moderation Page
 *
 * The review backend (schema, service, module) is not yet implemented.
 * reviews.controller.ts is fully commented out and no review schema exists.
 *
 * Once the review system backend is active (REV-001 to REV-004), this page
 * will connect to:
 *   GET  /api/v1/admin/reviews          — list all reviews (admin)
 *   PATCH /api/v1/admin/reviews/:id      — approve / reject / flag
 *   DELETE /api/v1/admin/reviews/:id     — remove review (admin override)
 *
 * For now this page serves as the UI skeleton for review moderation.
 */

interface Review {
  id: string;
  productId: string;
  productName: string;
  userId: string;
  userName: string;
  rating: number;
  title: string;
  body: string;
  status: "pending" | "approved" | "rejected" | "flagged";
  createdAt: string;
}

const STATUS_COLORS: Record<Review["status"], string> = {
  pending: "bg-yellow-500/20 text-yellow-300",
  approved: "bg-green-500/20 text-green-300",
  rejected: "bg-red-500/20 text-red-300",
  flagged: "bg-orange-500/20 text-orange-300",
};

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="text-[#E6C068]">
      {"★".repeat(Math.max(0, Math.min(5, rating)))}
      {"☆".repeat(5 - Math.max(0, Math.min(5, rating)))}
    </span>
  );
}

export default function AdminReviewsPage() {
  const [filter, setFilter] = useState<Review["status"] | "all">("all");

  // Placeholder: no reviews available until the review backend is built.
  const reviews: Review[] = [];
  const loading = false;

  const filtered =
    filter === "all" ? reviews : reviews.filter((r) => r.status === filter);

  return (
    <>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1
          className="text-2xl font-bold uppercase tracking-tight text-white sm:text-4xl"
          style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
        >
          Review Moderation
        </h1>
        <div className="flex gap-2">
          {(["all", "pending", "approved", "rejected", "flagged"] as const).map(
            (s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition ${
                  filter === s
                    ? "bg-[#FF4D00] text-white"
                    : "bg-white/10 text-white/60 hover:bg-white/20"
                }`}
              >
                {s}
              </button>
            )
          )}
        </div>
      </div>

      {/* Backend status notice */}
      <Card className="mb-8 border-yellow-500/30 bg-yellow-500/5">
        <CardContent className="py-4">
          <p className="text-sm text-yellow-200">
            <strong>Review system not yet active.</strong> The review backend
            (schema, service, module) needs to be implemented before reviews
            appear here. Refer to tasks REV-001 through REV-004 in the
            development roadmap.
          </p>
        </CardContent>
      </Card>

      {loading ? (
        <p className="py-8 text-white/60">Loading reviews…</p>
      ) : filtered.length === 0 ? (
        <p className="py-8 text-white/60">
          {filter === "all"
            ? "No reviews to moderate."
            : `No ${filter} reviews.`}
        </p>
      ) : (
        <div className="space-y-4">
          {filtered.map((review) => (
            <Card
              key={review.id}
              className="border-white/10 bg-[#1A1A1A]"
            >
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-center gap-3">
                  <StarRating rating={review.rating} />
                  <span className="font-semibold text-white">
                    {review.title}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[review.status]}`}
                  >
                    {review.status}
                  </span>
                </div>
                <p className="text-xs text-white/40">
                  by {review.userName} • on {review.productName} •{" "}
                  {new Date(review.createdAt).toLocaleDateString()}
                </p>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-white/70">{review.body}</p>
                <div className="flex gap-2">
                  <button className="rounded bg-green-600/20 px-3 py-1 text-xs font-medium text-green-300 hover:bg-green-600/30">
                    Approve
                  </button>
                  <button className="rounded bg-red-600/20 px-3 py-1 text-xs font-medium text-red-300 hover:bg-red-600/30">
                    Reject
                  </button>
                  <button className="rounded bg-orange-600/20 px-3 py-1 text-xs font-medium text-orange-300 hover:bg-orange-600/30">
                    Flag
                  </button>
                  <button className="rounded bg-white/10 px-3 py-1 text-xs font-medium text-white/60 hover:bg-white/20">
                    Delete
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
