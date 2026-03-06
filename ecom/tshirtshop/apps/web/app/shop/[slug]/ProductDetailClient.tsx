"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ThumbsUp, Star, ChevronDown, ChevronUp } from "lucide-react";
import type { ProductDisplay } from "@/lib/api/catalog";
import { addToCart } from "@/lib/api/cart";
import { useCartCount } from "@/lib/cart-count-context";
import {
  fetchProductReviews,
  voteReviewHelpful,
  type Review,
} from "@/lib/api/reviews";
import { useAuth } from "@/components/auth-provider";
import { ReviewForm } from "@/components/review-form";

interface ProductDetailClientProps {
  product: ProductDisplay;
  relatedProducts: ProductDisplay[];
}

export default function ProductDetailClient({
  product,
  relatedProducts,
}: ProductDetailClientProps) {
  const [selectedSize, setSelectedSize] = useState<string>("M");
  const [accordionOpen, setAccordionOpen] = useState<string | null>("description");
  const [addStatus, setAddStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [votingId, setVotingId] = useState<string | null>(null);
  const [helpfulVotes, setHelpfulVotes] = useState<Set<string>>(new Set());
  const { session } = useAuth();
  const isLoggedIn = !!session?.user;
  const { setCount } = useCartCount();

  const sizes = ["XS", "S", "M", "L", "XL"];

  // Load persisted helpful votes from localStorage on mount (keyed by user ID so votes are per-user)
  useEffect(() => {
    const storageKey = `helpful_votes_${session?.user?.id ?? "guest"}`;
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) setHelpfulVotes(new Set(JSON.parse(stored) as string[]));
    } catch {
      // ignore
    }
  }, [session?.user?.id]);

  useEffect(() => {
    let cancelled = false;
    fetchProductReviews(product.id).then((res) => {
      if (!cancelled && res?.data) setReviews(res.data);
    });
    return () => {
      cancelled = true;
    };
  }, [product.id]);

  const handleHelpfulToggle = async (reviewId: string) => {
    if (!isLoggedIn) return; // require auth
    setVotingId(reviewId);
    const alreadyVoted = helpfulVotes.has(reviewId);
    const result = await voteReviewHelpful(reviewId, !alreadyVoted);
    if (result) {
      // Update review count in list
      setReviews((prev) =>
        prev
          ? prev.map((r) =>
              r.id === reviewId ? { ...r, helpfulCount: result.helpfulCount } : r
            )
          : prev
      );
      // Toggle vote state and persist to localStorage
      setHelpfulVotes((prev) => {
        const next = new Set(prev);
        if (alreadyVoted) {
          next.delete(reviewId);
        } else {
          next.add(reviewId);
        }
        const storageKey = `helpful_votes_${session?.user?.id ?? "guest"}`;
        try {
          localStorage.setItem(storageKey, JSON.stringify(Array.from(next)));
        } catch {
          // ignore
        }
        return next;
      });
    }
    setVotingId(null);
  };

  const accordionSections = [
    {
      id: "description",
      title: "Description",
      content:
        product.description ??
        "Premium cotton blend. Minimal design. Built for the table and the street. Each piece is crafted with attention to detail for adventurers who demand quality.",
    },
    {
      id: "materials",
      title: "Materials",
      content:
        "100% combed cotton. 320gsm weight. Reinforced stitching. Pre-shrunk.",
    },
    {
      id: "sizing",
      title: "Sizing Guide",
      content:
        "Model is 6'0\" wearing size M. Fits true to size. For a relaxed fit, size up.",
    },
    {
      id: "shipping",
      title: "Shipping",
      content:
        "Free shipping on orders over $75. Standard delivery 5-7 business days. Express available at checkout.",
    },
  ];

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-10 sm:px-6 sm:py-16">
      {/* Breadcrumb */}
      <nav className="mb-8 flex overflow-x-auto pb-1 text-[10px] uppercase tracking-widest text-white/60 sm:mb-12 sm:text-xs [scrollbar-width:none] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden">
        <Link href="/" className="hover:text-white">
          Home
        </Link>
        <span className="mx-2">/</span>
        <Link href="/shop" className="hover:text-white">
          Shop
        </Link>
        <span className="mx-2">/</span>
        <span className="text-white">{product.name}</span>
      </nav>

      {/* Two-column layout */}
      <div className="mb-16 grid grid-cols-1 gap-8 sm:mb-24 sm:gap-12 lg:grid-cols-2">
        {/* Left: Gallery */}
        <div className="space-y-4">
          <div className="aspect-square overflow-hidden bg-[#1A1A1A]">
            <img
              src={product.imageUrl}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            <div className="h-16 w-16 min-w-[64px] shrink-0 overflow-hidden rounded bg-[#1A1A1A] sm:h-20 sm:w-20">
              <img
                src={product.imageUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* Right: Details */}
        <div>
          <h1
            className="mb-4 text-2xl font-bold uppercase tracking-tight text-white sm:text-4xl md:text-5xl"
            style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
          >
            {product.name}
          </h1>
          <p className="mb-2 text-xl text-[#E6C068] sm:mb-4 sm:text-2xl">
            ${product.price}
          </p>
          {(product.reviewCount != null && product.reviewCount > 0) && (
            <div className="mb-6 flex items-center gap-2 text-sm text-white/80 sm:mb-8">
              <span className="flex" aria-label={`${product.averageRating ?? 0} out of 5 stars`}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`size-4 ${
                      s <= (product.averageRating ?? 0)
                        ? "fill-[#E6C068] text-[#E6C068]"
                        : "fill-none text-white/30"
                    }`}
                  />
                ))}
              </span>
              <span>
                {product.averageRating?.toFixed(1)} ({product.reviewCount} review
                {product.reviewCount === 1 ? "" : "s"})
              </span>
            </div>
          )}

          {/* Size selector */}
          <div className="mb-8">
            <p className="mb-3 text-xs uppercase tracking-widest text-white/60">
              Size
            </p>
            <div className="flex flex-wrap gap-2">
              {sizes.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`min-h-[44px] min-w-[44px] rounded-md border px-3 py-2 text-sm font-medium uppercase transition-colors sm:min-w-[48px] sm:px-4 ${
                    selectedSize === size
                      ? "border-[#FF4D00] bg-[#FF4D00]/10 text-[#FF4D00]"
                      : "border-white/20 text-white hover:border-white/40"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Add to Cart */}
          <button
            className="mb-6 min-h-[48px] w-full rounded-md bg-[#FF4D00] py-4 text-sm font-medium uppercase tracking-wider text-white transition-all hover:bg-[#FF4D00]/90 hover:shadow-[0_0_24px_rgba(255,77,0,0.3)] disabled:opacity-70 sm:mb-8"
            onClick={async () => {
              setAddStatus("loading");
              try {
                const result = await addToCart(product.id, 1);
                setCount(result.cart.itemCount);
                setAddStatus("success");
              } catch {
                setAddStatus("error");
              }
            }}
            disabled={addStatus === "loading"}
          >
            {addStatus === "loading" ? "Adding…" : "Add to Cart"}
          </button>
          {addStatus === "success" && (
            <p className="mb-6 text-sm text-[#4ADE80] sm:mb-8">
              Added to cart. <Link href="/cart" className="underline">View cart</Link>
            </p>
          )}
          {addStatus === "error" && (
            <p className="mb-6 text-sm text-red-400 sm:mb-8">
              Could not add to cart. Please try again.
            </p>
          )}
        </div>
      </div>

      {/* Accordion: Product Details */}
      <div className="mb-16 border-t border-white/10 pt-8 sm:mb-24 sm:pt-12">
        {accordionSections.map((section) => (
          <div
            key={section.id}
            className="border-b border-white/10"
          >
            <button
              onClick={() =>
                setAccordionOpen(
                  accordionOpen === section.id ? null : section.id
                )
              }
              className="flex min-h-[48px] w-full items-center justify-between py-4 text-left"
            >
              <span className="text-sm font-medium uppercase tracking-wider text-white">
                {section.title}
              </span>
              {accordionOpen === section.id ? (
                <ChevronUp className="size-4 text-white/60" />
              ) : (
                <ChevronDown className="size-4 text-white/60" />
              )}
            </button>
            {accordionOpen === section.id && (
              <div className="pb-4 text-sm leading-relaxed text-white/80">
                {section.content}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Reviews */}
      <div className="mb-16 border-t border-white/10 pt-8 sm:mb-24 sm:pt-12">
        <h2
          className="mb-6 text-xl font-bold uppercase tracking-tight text-white sm:mb-8 sm:text-2xl"
          style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
        >
          Reviews
        </h2>

        {/* Review summary bar */}
        {reviews && reviews.length > 0 && (
          <div className="mb-6 flex items-center gap-3 sm:mb-8">
            <span className="text-3xl font-bold text-white">
              {(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)}
            </span>
            <div>
              <span className="flex">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`size-4 ${
                      s <=
                      Math.round(
                        reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
                      )
                        ? "fill-[#E6C068] text-[#E6C068]"
                        : "fill-none text-white/30"
                    }`}
                  />
                ))}
              </span>
              <p className="text-xs text-white/60">
                Based on {reviews.length} review{reviews.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>
        )}

        {/* Write a review — visible only when logged in */}
        {isLoggedIn && (
          <div className="mb-8">
            <ReviewForm
              productId={product.id}
              onReviewCreated={(newReview) => {
                setReviews((prev) => (prev ? [newReview, ...prev] : [newReview]));
              }}
            />
          </div>
        )}
        {!isLoggedIn && (
          <p className="mb-8 text-sm text-white/60">
            <Link href="/login" className="text-[#FF4D00] hover:underline">
              Sign in
            </Link>{" "}
            to leave a review.
          </p>
        )}

        {reviews === null ? (
          <p className="text-sm text-white/60">Loading reviews…</p>
        ) : reviews.length === 0 ? (
          <p className="text-sm text-white/60">No reviews yet.</p>
        ) : (
          <ul className="space-y-6">
            {reviews.map((r) => (
              <li
                key={r.id}
                className="rounded-lg border border-white/10 bg-white/5 p-4"
              >
                <div className="mb-2 flex items-center gap-2">
                  <span className="flex">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`size-4 ${
                          s <= r.rating
                            ? "fill-[#E6C068] text-[#E6C068]"
                            : "fill-none text-white/30"
                        }`}
                      />
                    ))}
                  </span>
                  <span className="text-sm font-medium text-white">
                    {r.userName}
                  </span>
                  <span className="text-xs text-white/50">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {r.title && (
                  <p className="mb-1 text-sm font-medium text-white">
                    {r.title}
                  </p>
                )}
                <p className="mb-3 text-sm text-white/80">{r.body}</p>
                <button
                  type="button"
                  onClick={() => handleHelpfulToggle(r.id)}
                  disabled={votingId === r.id || !isLoggedIn}
                  title={!isLoggedIn ? "Sign in to mark as helpful" : helpfulVotes.has(r.id) ? "Remove helpful vote" : "Mark as helpful"}
                  className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                    helpfulVotes.has(r.id)
                      ? "border-[#FF4D00]/60 bg-[#FF4D00]/10 text-[#FF4D00] hover:bg-[#FF4D00]/20"
                      : "border-white/10 bg-white/5 text-white/60 hover:border-white/30 hover:text-white"
                  }`}
                >
                  <ThumbsUp
                    size={13}
                    className={helpfulVotes.has(r.id) ? "fill-[#FF4D00]" : ""}
                    strokeWidth={helpfulVotes.has(r.id) ? 0 : 1.8}
                  />
                  Helpful{r.helpfulCount > 0 ? ` (${r.helpfulCount})` : ""}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Related Products — links use slug for clean URLs */}
      <div>
        <h2
          className="mb-6 text-xl font-bold uppercase tracking-tight text-white sm:mb-8 sm:text-2xl"
          style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
        >
          Related
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3">
          {relatedProducts.map((p) => (
            <Link key={p.id} href={`/shop/${p.slug}`} className="group block">
              <div className="aspect-square overflow-hidden bg-[#1A1A1A]">
                <img
                  src={p.imageUrl}
                  alt={p.name}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="mt-2 sm:mt-4">
                <p className="truncate text-xs font-medium text-white sm:text-base">
                  {p.name}
                </p>
                <p className="text-xs text-[#E6C068] sm:text-sm">
                  ${p.price}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
