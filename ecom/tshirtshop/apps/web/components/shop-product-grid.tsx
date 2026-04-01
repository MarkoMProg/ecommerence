"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Star, LayoutGrid, List } from "lucide-react";

interface Product {
  id: string | number;
  slug: string;
  name: string;
  price: number | string;
  imageUrl: string;
  averageRating?: number | null;
  reviewCount?: number | null;
}

export function ShopProductGrid({ products }: { products: Product[] }) {
  const [view, setView] = useState<"grid" | "list">("grid");

  return (
    <div>
      {/* View toggle */}
      <div className="mb-4 flex justify-end gap-2">
        <button
          onClick={() => setView("grid")}
          aria-label="Grid view"
          className={`rounded p-1.5 transition-colors ${
            view === "grid" ? "text-[#FF4D00]" : "text-white/40 hover:text-white"
          }`}
        >
          <LayoutGrid className="size-5" />
        </button>
        <button
          onClick={() => setView("list")}
          aria-label="List view"
          className={`rounded p-1.5 transition-colors ${
            view === "list" ? "text-[#FF4D00]" : "text-white/40 hover:text-white"
          }`}
        >
          <List className="size-5" />
        </button>
      </div>

      {/* Grid view */}
      {view === "grid" && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <Link key={product.id} href={`/shop/${product.slug}`} className="group block">
              <div className="relative aspect-square overflow-hidden bg-[#1A1A1A]">
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all duration-300 group-hover:bg-black/40 group-hover:opacity-100">
                  <span className="rounded-md border border-white px-6 py-2 text-sm font-medium uppercase tracking-wider text-white">
                    View
                  </span>
                </div>
              </div>
              <div className="mt-2 sm:mt-4">
                <p className="truncate text-xs font-medium text-white sm:text-base">{product.name}</p>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-[#E6C068] sm:text-sm">${product.price}</p>
                  {product.reviewCount != null && product.reviewCount > 0 && (
                    <span className="flex items-center gap-1 text-xs text-white/60">
                      <Star className="size-3.5 fill-[#E6C068] text-[#E6C068]" />
                      {product.averageRating?.toFixed(1)}
                      <span>({product.reviewCount})</span>
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* List view */}
      {view === "list" && (
        <div className="flex flex-col divide-y divide-white/10">
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/shop/${product.slug}`}
              className="group flex items-center gap-4 py-4 sm:gap-6 sm:py-5"
            >
              <div className="relative size-20 shrink-0 overflow-hidden bg-[#1A1A1A] sm:size-28">
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  fill
                  sizes="112px"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <p className="truncate text-sm font-medium text-white group-hover:text-[#FF4D00] transition-colors sm:text-base">
                  {product.name}
                </p>
                <div className="flex items-center gap-3">
                  <p className="text-sm text-[#E6C068]">${product.price}</p>
                  {product.reviewCount != null && product.reviewCount > 0 && (
                    <span className="flex items-center gap-1 text-xs text-white/60">
                      <Star className="size-3.5 fill-[#E6C068] text-[#E6C068]" />
                      {product.averageRating?.toFixed(1)}
                      <span>({product.reviewCount})</span>
                    </span>
                  )}
                </div>
              </div>
              <span className="shrink-0 text-xs uppercase tracking-wider text-white/40 group-hover:text-white transition-colors">
                View →
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
