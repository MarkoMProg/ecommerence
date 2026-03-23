"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Star, Pencil, Trash2, X, MessageSquareText } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import {
  fetchMyReviews,
  updateReview,
  deleteReview,
  type UserReview,
} from "@/lib/api/reviews";
import {
  containsHtml,
  MAX_REVIEW_BODY_LENGTH,
  MAX_REVIEW_TITLE_LENGTH,
} from "@/lib/validation";

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

function StarDisplay({ rating }: { rating: number }) {
  return (
    <span className="flex">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`size-4 ${
            s <= rating
              ? "fill-[#E6C068] text-[#E6C068]"
              : "fill-none text-white/30"
          }`}
        />
      ))}
    </span>
  );
}

function StarInput({
  rating,
  onSelect,
}: {
  rating: number;
  onSelect: (r: number) => void;
}) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onSelect(s)}
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          className="min-h-[44px] min-w-[44px] transition-colors"
          aria-label={`${s} star${s > 1 ? "s" : ""}`}
        >
          <Star
            className={`size-5 ${
              s <= (hover || rating)
                ? "fill-[#E6C068] text-[#E6C068]"
                : "fill-none text-white/30"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export default function MyReviewsPage() {
  const { session } = useAuth();
  const [reviews, setReviews] = useState<UserReview[] | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(0);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user) return;
    let cancelled = false;
    fetchMyReviews().then((data) => {
      if (!cancelled) setReviews(data);
    });
    return () => {
      cancelled = true;
    };
  }, [session?.user]);

  function startEdit(r: UserReview) {
    setEditingId(r.id);
    setEditRating(r.rating);
    setEditTitle(r.title ?? "");
    setEditBody(r.body);
    setSaveError("");
  }

  function cancelEdit() {
    setEditingId(null);
    setSaveError("");
  }

  async function handleSave(reviewId: string) {
    if (editRating < 1 || editRating > 5) {
      setSaveError("Please select a rating.");
      return;
    }
    if (!editBody.trim()) {
      setSaveError("Review body is required.");
      return;
    }
    if (containsHtml(editTitle) || containsHtml(editBody)) {
      setSaveError("HTML is not allowed.");
      return;
    }
    if (editTitle.length > MAX_REVIEW_TITLE_LENGTH) {
      setSaveError(`Title must not exceed ${MAX_REVIEW_TITLE_LENGTH} characters.`);
      return;
    }
    if (editBody.length > MAX_REVIEW_BODY_LENGTH) {
      setSaveError(`Body must not exceed ${MAX_REVIEW_BODY_LENGTH} characters.`);
      return;
    }

    setSaving(true);
    setSaveError("");
    const updated = await updateReview(reviewId, {
      rating: editRating,
      title: editTitle.trim() || undefined,
      body: editBody.trim(),
    });
    setSaving(false);

    if (updated) {
      setReviews((prev) =>
        prev
          ? prev.map((r) =>
              r.id === reviewId
                ? { ...r, ...updated }
                : r
            )
          : prev
      );
      setEditingId(null);
    } else {
      setSaveError("Failed to save changes. Please try again.");
    }
  }

  async function handleDelete(reviewId: string) {
    setDeletingId(reviewId);
    const ok = await deleteReview(reviewId);
    setDeletingId(null);
    setConfirmDeleteId(null);
    if (ok) {
      setReviews((prev) => (prev ? prev.filter((r) => r.id !== reviewId) : prev));
    }
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="border-b border-white/10 pb-6">
        <p className="mb-1 text-[10px] uppercase tracking-widest text-white/40">
          Account
        </p>
        <h1
          className="text-2xl font-bold uppercase tracking-tight text-white sm:text-3xl"
          style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
        >
          My Reviews
        </h1>
      </div>

      {reviews === null ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-xl bg-white/5"
            />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <MessageSquareText className="size-10 text-white/10" />
          <p className="text-sm text-white/40">
            You haven&apos;t written any reviews yet.
          </p>
          <Link
            href="/shop"
            className="text-xs text-[#FF4D00] hover:underline"
          >
            Browse products →
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {reviews.map((r) => (
            <li
              key={r.id}
              className="rounded-xl border border-white/10 bg-[#1A1A1A] p-5"
            >
              {/* Header: product name + actions */}
              <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <Link
                    href={`/shop/${r.productSlug}`}
                    className="text-sm font-medium text-white hover:text-[#FF4D00] transition-colors"
                  >
                    {r.productName}
                  </Link>
                  <p className="mt-0.5 text-[10px] text-white/40">
                    {formatDate(r.createdAt)}
                    {r.helpfulCount > 0 && (
                      <span>
                        {" "}
                        · {r.helpfulCount} found helpful
                      </span>
                    )}
                  </p>
                </div>

                {editingId !== r.id && (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => startEdit(r)}
                      className="flex h-8 w-8 items-center justify-center rounded-md border border-white/10 text-white/40 hover:border-white/20 hover:text-white transition-colors"
                      title="Edit review"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    {confirmDeleteId === r.id ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleDelete(r.id)}
                          disabled={deletingId === r.id}
                          className="rounded-md border border-red-500/30 bg-red-500/10 px-2.5 py-1.5 text-[10px] uppercase tracking-wider text-red-400 hover:bg-red-500/20 disabled:opacity-50 transition-colors"
                        >
                          {deletingId === r.id ? "Deleting…" : "Confirm"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="flex h-8 w-8 items-center justify-center rounded-md border border-white/10 text-white/40 hover:text-white transition-colors"
                          title="Cancel"
                        >
                          <X className="size-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(r.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-md border border-white/10 text-white/40 hover:border-red-500/30 hover:text-red-400 transition-colors"
                        title="Delete review"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {editingId === r.id ? (
                /* ── Edit mode ── */
                <div className="space-y-4">
                  <div>
                    <p className="mb-2 text-xs uppercase tracking-widest text-white/60">
                      Rating
                    </p>
                    <StarInput rating={editRating} onSelect={setEditRating} />
                  </div>
                  <div>
                    <label
                      htmlFor={`edit-title-${r.id}`}
                      className="mb-2 block text-xs uppercase tracking-widest text-white/60"
                    >
                      Title (optional)
                    </label>
                    <input
                      id={`edit-title-${r.id}`}
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      maxLength={MAX_REVIEW_TITLE_LENGTH}
                      className="w-full rounded-md border border-white/20 bg-transparent px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-[#FF4D00] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor={`edit-body-${r.id}`}
                      className="mb-2 block text-xs uppercase tracking-widest text-white/60"
                    >
                      Review
                    </label>
                    <textarea
                      id={`edit-body-${r.id}`}
                      value={editBody}
                      onChange={(e) => setEditBody(e.target.value)}
                      maxLength={MAX_REVIEW_BODY_LENGTH}
                      rows={4}
                      className="w-full rounded-md border border-white/20 bg-transparent px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-[#FF4D00] focus:outline-none"
                    />
                    <div className="mt-1 flex justify-end">
                      <span className="text-xs text-white/40">
                        {editBody.length}/{MAX_REVIEW_BODY_LENGTH}
                      </span>
                    </div>
                  </div>
                  {saveError && (
                    <p className="text-sm text-red-400">{saveError}</p>
                  )}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSave(r.id)}
                      disabled={saving}
                      className="min-h-[40px] rounded-md bg-[#FF4D00] px-5 py-2 text-xs font-medium uppercase tracking-wider text-white transition-all hover:bg-[#FF4D00]/90 disabled:opacity-70"
                    >
                      {saving ? "Saving…" : "Save Changes"}
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="min-h-[40px] rounded-md border border-white/20 px-5 py-2 text-xs font-medium uppercase tracking-wider text-white/60 hover:bg-white/5 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                /* ── Display mode ── */
                <div>
                  <div className="mb-2">
                    <StarDisplay rating={r.rating} />
                  </div>
                  {r.title && (
                    <p className="mb-1 text-sm font-medium text-white">
                      {r.title}
                    </p>
                  )}
                  <p className="text-sm text-white/80">{r.body}</p>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
