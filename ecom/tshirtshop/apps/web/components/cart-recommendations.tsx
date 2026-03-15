"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { fetchCartRecommendations } from "@/lib/api/cart";
import type { ProductDisplay } from "@/lib/api/catalog";

interface CartRecommendationsProps {
  /** Compact layout for drawer; default is full grid for cart page */
  variant?: "full" | "compact";
}

export function CartRecommendations({ variant = "full" }: CartRecommendationsProps) {
  const [products, setProducts] = useState<ProductDisplay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchCartRecommendations(variant === "compact" ? 4 : 6)
      .then((data) => {
        if (!cancelled) setProducts(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [variant]);

  if (loading || products.length === 0) return null;

  if (variant === "compact") {
    return (
      <div className="border-t border-white/10 pt-4">
        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-white/60">
          You might also like
        </p>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {products.map((p) => (
            <Link
              key={p.id}
              href={`/shop/${p.slug}`}
              className="flex shrink-0 flex-col"
            >
              <div className="relative h-20 w-20 overflow-hidden rounded bg-white/5">
                <Image
                  src={p.imageUrl}
                  alt={p.name}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </div>
              <p className="mt-1 max-w-[80px] truncate text-xs text-white">
                {p.name}
              </p>
              <p className="text-xs text-[#E6C068]">${p.price.toFixed(2)}</p>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2
        className="mb-6 text-xl font-bold uppercase tracking-tight text-white sm:mb-8 sm:text-2xl"
        style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
      >
        You might also like
      </h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3">
        {products.map((p) => (
          <Link key={p.id} href={`/shop/${p.slug}`} className="group block">
            <div className="relative aspect-square overflow-hidden rounded bg-[#1A1A1A]">
              <Image
                src={p.imageUrl}
                alt={p.name}
                fill
                sizes="(max-width: 640px) 50vw, 33vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <div className="mt-2 sm:mt-4">
              <p className="truncate text-xs font-medium text-white sm:text-base">
                {p.name}
              </p>
              <p className="text-xs text-[#E6C068] sm:text-sm">
                ${p.price.toFixed(2)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
