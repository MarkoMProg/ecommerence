"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { createReview, type Review } from "@/lib/api/reviews";
import {
  containsHtml,
  MAX_REVIEW_BODY_LENGTH,
  MAX_REVIEW_TITLE_LENGTH,
} from "@/lib/validation";

interface ReviewFormProps {
  productId: string;
  /** Called after the review is successfully created */
  onReviewCreated: (review: Review) => void;
}

/**
 * Form for creating a product review.
 * Only shown to authenticated users who have purchased the product.
 */
export function ReviewForm({ productId, onReviewCreated }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const titleError =
    title && containsHtml(title)
      ? "Title must not contain HTML"
      : title.length > MAX_REVIEW_TITLE_LENGTH
        ? `Title must not exceed ${MAX_REVIEW_TITLE_LENGTH} characters`
        : "";

  const bodyError =
    body && containsHtml(body)
      ? "Review must not contain HTML"
      : body.length > MAX_REVIEW_BODY_LENGTH
        ? `Review must not exceed ${MAX_REVIEW_BODY_LENGTH} characters`
        : "";

  const hasClientErrors = !!titleError || !!bodyError;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1 || rating > 5) {
      setErrorMsg("Please select a star rating.");
      return;
    }
    if (!body.trim()) {
      setErrorMsg("Please write a review.");
      return;
    }
    if (hasClientErrors) {
      setErrorMsg("Please fix the errors above.");
      return;
    }

    setStatus("loading");
    setErrorMsg("");

    const review = await createReview(productId, {
      rating,
      title: title.trim() || undefined,
      body: body.trim(),
    });

    if (review) {
      setStatus("idle");
      setRating(0);
      setTitle("");
      setBody("");
      onReviewCreated(review);
    } else {
      setStatus("error");
      setErrorMsg("Could not submit review. You may need to purchase this product first, or you may have already reviewed it.");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-white/10 bg-white/5 p-4 sm:p-6"
    >
      <h3
        className="mb-4 text-sm font-bold uppercase tracking-wider text-white"
        style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
      >
        Write a Review
      </h3>

      {/* Star rating input */}
      <div className="mb-4">
        <p className="mb-2 text-xs uppercase tracking-widest text-white/60">
          Rating
        </p>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setRating(s)}
              onMouseEnter={() => setHoverRating(s)}
              onMouseLeave={() => setHoverRating(0)}
              className="min-h-[44px] min-w-[44px] transition-colors"
              aria-label={`${s} star${s > 1 ? "s" : ""}`}
            >
              <Star
                className={`size-6 ${
                  s <= (hoverRating || rating)
                    ? "fill-[#E6C068] text-[#E6C068]"
                    : "fill-none text-white/30"
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Title */}
      <div className="mb-4">
        <label
          htmlFor="review-title"
          className="mb-2 block text-xs uppercase tracking-widest text-white/60"
        >
          Title (optional)
        </label>
        <input
          id="review-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={MAX_REVIEW_TITLE_LENGTH}
          placeholder="Summarise your review"
          className="w-full rounded-md border border-white/20 bg-transparent px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-[#FF4D00] focus:outline-none"
        />
        {titleError && <p className="mt-1 text-xs text-red-400">{titleError}</p>}
      </div>

      {/* Body */}
      <div className="mb-4">
        <label
          htmlFor="review-body"
          className="mb-2 block text-xs uppercase tracking-widest text-white/60"
        >
          Review
        </label>
        <textarea
          id="review-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={MAX_REVIEW_BODY_LENGTH}
          rows={4}
          placeholder="Share your experience with this product…"
          className="w-full rounded-md border border-white/20 bg-transparent px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-[#FF4D00] focus:outline-none"
        />
        <div className="mt-1 flex justify-between">
          {bodyError ? <p className="text-xs text-red-400">{bodyError}</p> : <span />}
          <span className="text-xs text-white/40">{body.length}/{MAX_REVIEW_BODY_LENGTH}</span>
        </div>
      </div>

      {errorMsg && (
        <p className="mb-4 text-sm text-red-400">{errorMsg}</p>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        className="min-h-[44px] rounded-md bg-[#FF4D00] px-6 py-2 text-sm font-medium uppercase tracking-wider text-white transition-all hover:bg-[#FF4D00]/90 disabled:opacity-70"
      >
        {status === "loading" ? "Submitting…" : "Submit Review"}
      </button>
    </form>
  );
}
