"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchSearchSuggestions } from "@/lib/api/catalog";

const DEBOUNCE_MS = 250;
const SUGGESTION_LIMIT = 8;

export interface ShopSearchInputProps {
  defaultValue?: string;
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

type SuggestionAction =
  | { type: "product"; text: string }
  | { type: "category"; text: string; slug: string }
  | { type: "brand"; text: string };

function buildShopHref(
  action: SuggestionAction,
  currentFilters: { category?: string; brand?: string; minPrice?: number; maxPrice?: number; sort?: string },
): string {
  const sp = new URLSearchParams();
  if (action.type === "product") sp.set("q", action.text);
  if (action.type === "category") sp.set("category", action.slug);
  if (action.type === "brand") sp.set("brand", action.text);
  if (currentFilters.category && currentFilters.category !== "all" && action.type !== "category")
    sp.set("category", currentFilters.category);
  if (currentFilters.brand && action.type !== "brand") sp.set("brand", currentFilters.brand);
  if (currentFilters.minPrice != null && !Number.isNaN(currentFilters.minPrice))
    sp.set("minPrice", String(currentFilters.minPrice));
  if (currentFilters.maxPrice != null && !Number.isNaN(currentFilters.maxPrice))
    sp.set("maxPrice", String(currentFilters.maxPrice));
  if (currentFilters.sort) sp.set("sort", currentFilters.sort);
  const qs = sp.toString();
  return qs ? `/shop?${qs}` : "/shop";
}

export function ShopSearchInput({
  defaultValue = "",
  category,
  brand,
  minPrice,
  maxPrice,
  sort,
}: ShopSearchInputProps) {
  const router = useRouter();
  const [inputValue, setInputValue] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<{
    products: string[];
    categories: { name: string; slug: string }[];
    brands: string[];
  }>({ products: [], categories: [], brands: [] });
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const debouncedInput = useDebounce(inputValue, DEBOUNCE_MS);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInputValue(defaultValue);
  }, [defaultValue]);

  useEffect(() => {
    if (debouncedInput.trim().length < 2) {
      setSuggestions({ products: [], categories: [], brands: [] });
      setShowDropdown(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchSearchSuggestions(debouncedInput, SUGGESTION_LIMIT)
      .then((data) => {
        if (!cancelled) {
          setSuggestions(data);
          setShowDropdown(
            data.products.length > 0 || data.categories.length > 0 || data.brands.length > 0,
          );
        }
      })
      .catch(() => {
        if (!cancelled) setSuggestions({ products: [], categories: [], brands: [] });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedInput]);

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
      setShowDropdown(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [handleClickOutside]);

  const currentFilters = { category, brand, minPrice, maxPrice, sort };

  const handleSuggestionClick = useCallback(
    (action: SuggestionAction) => {
      setInputValue(action.text);
      setShowDropdown(false);
      const href = buildShopHref(action, currentFilters);
      router.push(href);
    },
    [category, brand, minPrice, maxPrice, sort, router],
  );

  const hasSuggestions =
    suggestions.products.length > 0 || suggestions.categories.length > 0 || suggestions.brands.length > 0;

  return (
    <div ref={containerRef} className="relative flex-1">
      <form action="/shop" method="get" className="flex gap-2">
        {category && category !== "all" && <input type="hidden" name="category" value={category} />}
        {brand && <input type="hidden" name="brand" value={brand} />}
        {minPrice != null && !Number.isNaN(minPrice) && (
          <input type="hidden" name="minPrice" value={minPrice} />
        )}
        {maxPrice != null && !Number.isNaN(maxPrice) && (
          <input type="hidden" name="maxPrice" value={maxPrice} />
        )}
        {sort && <input type="hidden" name="sort" value={sort} />}
        <div className="relative flex-1">
          <input
            type="search"
            name="q"
            placeholder="Search products..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onFocus={() => hasSuggestions && setShowDropdown(true)}
            className="min-h-[44px] w-full rounded-md border border-white/20 bg-[#1A1A1A] px-4 py-2 text-sm text-white placeholder:text-white/50 focus:border-[#FF4D00] focus:outline-none focus:ring-1 focus:ring-[#FF4D00]"
            aria-label="Search products"
            aria-autocomplete="list"
            aria-expanded={showDropdown}
            aria-controls="search-suggestions"
            autoComplete="off"
          />
          {showDropdown && hasSuggestions && (
            <ul
              id="search-suggestions"
              role="listbox"
              className="absolute top-full left-0 right-0 z-50 mt-1 max-h-64 overflow-auto rounded-md border border-white/20 bg-[#1A1A1A] py-1 shadow-lg"
            >
              {suggestions.products.map((name) => (
                <li key={`product-${name}`} role="option">
                  <button
                    type="button"
                    onClick={() => handleSuggestionClick({ type: "product", text: name })}
                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-white transition-colors hover:bg-white/10"
                  >
                    <span className="rounded bg-white/20 px-1.5 py-0.5 text-xs text-white/80">
                      Product
                    </span>
                    {name}
                  </button>
                </li>
              ))}
              {suggestions.categories.map((c) => (
                <li key={`category-${c.slug}`} role="option">
                  <button
                    type="button"
                    onClick={() => handleSuggestionClick({ type: "category", text: c.name, slug: c.slug })}
                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-white transition-colors hover:bg-white/10"
                  >
                    <span className="rounded bg-[#7A5FFF]/80 px-1.5 py-0.5 text-xs text-white">
                      Category
                    </span>
                    {c.name}
                  </button>
                </li>
              ))}
              {suggestions.brands.map((name) => (
                <li key={`brand-${name}`} role="option">
                  <button
                    type="button"
                    onClick={() => handleSuggestionClick({ type: "brand", text: name })}
                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-white transition-colors hover:bg-white/10"
                  >
                    <span className="rounded bg-[#E6C068]/80 px-1.5 py-0.5 text-xs text-[#0A0A0A]">
                      Brand
                    </span>
                    {name}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {loading && debouncedInput.trim().length >= 2 && (
            <div
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/50"
              aria-hidden
            >
              <span className="animate-pulse text-xs">...</span>
            </div>
          )}
        </div>
        <button
          type="submit"
          className="min-h-[44px] min-w-[44px] rounded-md bg-[#FF4D00] px-4 py-2 text-sm font-medium uppercase tracking-wider text-white transition-colors hover:bg-[#FF4D00]/90"
        >
          Search
        </button>
      </form>
    </div>
  );
}
