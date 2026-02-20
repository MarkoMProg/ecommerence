"use client";

import { useState } from "react";
import Link from "next/link";
import type { ProductDisplay } from "@/lib/api/catalog";
import { addToCart } from "@/lib/api/cart";

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

  const sizes = ["XS", "S", "M", "L", "XL"];

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
          <p className="mb-6 text-xl text-[#E6C068] sm:mb-8 sm:text-2xl">
            ${product.price}
          </p>

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
                await addToCart(product.id, 1);
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
              <span className="text-white/60">
                {accordionOpen === section.id ? "−" : "+"}
              </span>
            </button>
            {accordionOpen === section.id && (
              <div className="pb-4 text-sm leading-relaxed text-white/80">
                {section.content}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Related Products */}
      <div>
        <h2
          className="mb-6 text-xl font-bold uppercase tracking-tight text-white sm:mb-8 sm:text-2xl"
          style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
        >
          Related
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3">
          {relatedProducts.map((p) => (
            <Link key={p.id} href={`/shop/${p.id}`} className="group block">
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
