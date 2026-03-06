"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Loader2, Search, X } from "lucide-react";
import { fetchProducts, type ProductDisplay } from "@/lib/api/catalog";
import { useDebounce } from "@/lib/use-debounce";

const DEBOUNCE_MS = 300;
const RESULTS_LIMIT = 6;
const FEATURED_LIMIT = 5;

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// ── Sub-component: single result row ──────────────────────────

function SearchResultRow({
  product,
  onClick,
}: {
  product: ProductDisplay;
  onClick: () => void;
}) {
  return (
    <Link
      href={`/shop/${product.slug}`}
      onClick={onClick}
      className="flex items-center gap-4 px-5 py-3 transition-colors duration-150 hover:bg-white/[0.04] focus-visible:bg-white/[0.04] focus-visible:outline-none"
    >
      {/* Thumbnail */}
      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-white/5">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full bg-white/10" aria-hidden="true" />
        )}
      </div>

      {/* Name + category */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium text-white">{product.name}</p>
        {product.category && (
          <p
            className="mt-0.5 truncate text-[11px] uppercase text-white/40"
            style={{ letterSpacing: "0.08em" }}
          >
            {product.category.replace(/-/g, " ")}
          </p>
        )}
      </div>

      {/* Price */}
      <p className="shrink-0 text-[13px] font-medium text-white">
        ${product.price.toFixed(2)}
      </p>
    </Link>
  );
}

// ── Main modal component ───────────────────────────────────────

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProductDisplay[]>([]);
  const [featured, setFeatured] = useState<ProductDisplay[]>([]);
  const [loading, setLoading] = useState(false);
  const [resultsTotal, setResultsTotal] = useState(0);
  const [hasError, setHasError] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebounce(query, DEBOUNCE_MS);

  // Reset + autofocus when opened; fetch featured products once per open
  useEffect(() => {
    if (!isOpen) return;

    setQuery("");
    setResults([]);
    setResultsTotal(0);
    setHasError(false);

    // Short delay so the DOM has painted before focusing
    const t = setTimeout(() => inputRef.current?.focus(), 60);

    // Featured / new arrivals for the empty state
    fetchProducts({ limit: FEATURED_LIMIT, sort: "newest" })
      .then(({ products }) => setFeatured(products))
      .catch(() => {});

    return () => clearTimeout(t);
  }, [isOpen]);

  // Debounced product search
  useEffect(() => {
    const trimmed = debouncedQuery.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setResultsTotal(0);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setHasError(false);

    fetchProducts({ q: trimmed, limit: RESULTS_LIMIT })
      .then(({ products, pagination }) => {
        if (!cancelled) {
          setResults(products);
          setResultsTotal(pagination.total);
        }
      })
      .catch(() => {
        if (!cancelled) setHasError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  // ESC key closes modal
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  const handleResultClick = useCallback(() => onClose(), [onClose]);

  const clearQuery = useCallback(() => {
    setQuery("");
    inputRef.current?.focus();
  }, []);

  if (!isOpen) return null;

  const trimmedQuery = query.trim();
  const isSearching = trimmedQuery.length >= 2;
  const shopAllHref = isSearching
    ? `/shop?q=${encodeURIComponent(trimmedQuery)}`
    : "/shop";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Search products"
      className="fixed inset-0 z-[60] flex flex-col items-center px-4 animate-in fade-in duration-150"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal panel */}
      <div
        className="relative z-10 w-full max-w-2xl mt-[10vh] sm:mt-[13vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input row */}
        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#111111] px-5 py-4 shadow-[0_24px_64px_rgba(0,0,0,0.6)]">
          {loading ? (
            <Loader2
              className="size-5 shrink-0 animate-spin text-white/35"
              strokeWidth={1.5}
              aria-hidden="true"
            />
          ) : (
            <Search
              className="size-5 shrink-0 text-white/35"
              strokeWidth={1.5}
              aria-hidden="true"
            />
          )}

          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products…"
            className="flex-1 bg-transparent text-[15px] text-white placeholder:text-white/30 focus:outline-none"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            aria-label="Search products"
          />

          {/* Clear query */}
          {query && (
            <button
              type="button"
              onClick={clearQuery}
              className="flex h-6 w-6 items-center justify-center text-white/35 transition-colors hover:text-white"
              aria-label="Clear search"
            >
              <X className="size-4" strokeWidth={1.5} />
            </button>
          )}

          {/* ESC hint + close */}
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 items-center justify-center rounded-md border border-white/10 px-2 text-[10px] font-medium uppercase tracking-[0.1em] text-white/30 transition-colors hover:border-white/20 hover:text-white/60"
            aria-label="Close search"
          >
            Esc
          </button>
        </div>

        {/* Results / featured panel */}
        <div className="mt-2 overflow-hidden rounded-xl border border-white/[0.07] bg-[#111111] shadow-[0_24px_64px_rgba(0,0,0,0.6)]">
          {/* ── No query: show featured products ──────────── */}
          {!isSearching && featured.length > 0 && (
            <>
              <div className="px-5 pb-2 pt-4">
                <p
                  className="text-[10px] uppercase text-white/30"
                  style={{ letterSpacing: "0.14em" }}
                >
                  New Arrivals
                </p>
              </div>
              <ul role="list">
                {featured.map((product) => (
                  <li key={product.id}>
                    <SearchResultRow product={product} onClick={handleResultClick} />
                  </li>
                ))}
              </ul>
              <div className="border-t border-white/[0.06] px-5 py-3">
                <Link
                  href="/shop"
                  onClick={onClose}
                  className="flex items-center justify-between text-[11px] uppercase text-white/40 transition-colors hover:text-white"
                  style={{ letterSpacing: "0.1em" }}
                >
                  <span>Browse all products</span>
                  <ArrowRight className="size-3.5" strokeWidth={1.5} />
                </Link>
              </div>
            </>
          )}

          {/* ── Query: loading skeleton ────────────────────── */}
          {isSearching && loading && results.length === 0 && (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-white/35">
              <Loader2 className="size-4 animate-spin" strokeWidth={1.5} aria-hidden="true" />
              Searching…
            </div>
          )}

          {/* ── Query: error ───────────────────────────────── */}
          {isSearching && !loading && hasError && (
            <div className="py-10 text-center text-sm text-white/40">
              Search unavailable — please try again.
            </div>
          )}

          {/* ── Query: no results ─────────────────────────── */}
          {isSearching && !loading && !hasError && results.length === 0 && (
            <div className="py-10 text-center">
              <p className="text-sm text-white/40">No products found for</p>
              <p className="mt-1 text-[13px] font-medium text-white">
                &ldquo;{trimmedQuery}&rdquo;
              </p>
              <Link
                href={shopAllHref}
                onClick={onClose}
                className="mt-4 inline-flex items-center gap-1.5 text-[11px] uppercase text-[#FF4D00] transition-opacity hover:opacity-80"
                style={{ letterSpacing: "0.1em" }}
              >
                Browse all products
                <ArrowRight className="size-3" strokeWidth={2} />
              </Link>
            </div>
          )}

          {/* ── Query: results ────────────────────────────── */}
          {isSearching && results.length > 0 && (
            <>
              <div className="px-5 pb-2 pt-4">
                <p
                  className="text-[10px] uppercase text-white/30"
                  style={{ letterSpacing: "0.14em" }}
                >
                  Products
                  {resultsTotal > RESULTS_LIMIT && (
                    <span className="ml-1.5 text-white/20">
                      ({resultsTotal} total)
                    </span>
                  )}
                </p>
              </div>
              <ul role="list">
                {results.map((product) => (
                  <li key={product.id}>
                    <SearchResultRow product={product} onClick={handleResultClick} />
                  </li>
                ))}
              </ul>

              {/* Footer: view-all link */}
              <div className="border-t border-white/[0.06] px-5 py-3">
                <Link
                  href={shopAllHref}
                  onClick={onClose}
                  className="flex items-center justify-between text-[11px] uppercase text-white/40 transition-colors hover:text-white"
                  style={{ letterSpacing: "0.1em" }}
                >
                  <span>
                    {resultsTotal > RESULTS_LIMIT
                      ? `View all ${resultsTotal} results for "${trimmedQuery}"`
                      : `View results in Shop`}
                  </span>
                  <ArrowRight className="size-3.5" strokeWidth={1.5} />
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
