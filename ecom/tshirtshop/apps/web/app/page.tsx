import Link from "next/link";
import { FEATURED_PRODUCTS, MOCK_CATEGORIES } from "@/lib/mock-data";

export default function HomePage() {
  return (
    <>
      {/* 1. Hero Section */}
      <section className="relative flex min-h-[70vh] min-w-0 items-center justify-center overflow-hidden bg-[#0A0A0A] sm:min-h-[85vh]">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40"
          style={{
            backgroundImage:
              "url(https://placehold.co/1920x1080/1a1a1a/ffffff?text=INFERNAL+COLLECTION)",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent" />
        <div className="relative z-10 mx-auto max-w-[1400px] px-4 py-8 text-center sm:px-6">
          <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-[#FF4D00] sm:mb-4 sm:text-xs sm:tracking-[0.3em]">
            New Drop — Infernal Collection
          </p>
          <h1
            className="mb-6 text-3xl font-bold uppercase tracking-tight text-white sm:mb-8 sm:text-5xl md:text-7xl lg:text-8xl"
            style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
          >
            Forged in Shadow.
          </h1>
          <Link
            href="/shop"
            className="inline-block min-h-[44px] min-w-[120px] rounded-md bg-[#FF4D00] px-4 py-3 text-sm font-medium uppercase tracking-wider text-white transition-all hover:bg-[#FF4D00]/90 hover:shadow-[0_0_24px_rgba(255,77,0,0.4)]"
          >
            Shop Now
          </Link>
        </div>
      </section>

      {/* 2. Featured Drop Grid */}
      <section className="border-t border-white/10 bg-[#0A0A0A] py-12 sm:py-20">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
          <h2
            className="mb-8 text-2xl font-bold uppercase tracking-tight text-white sm:mb-12 sm:text-3xl md:text-4xl"
            style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
          >
            Featured Drops
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 sm:gap-8 lg:grid-cols-4">
            {FEATURED_PRODUCTS.map((product) => (
              <Link
                key={product.id}
                href={`/shop/${product.id}`}
                className="group block"
              >
                <div className="relative aspect-square overflow-hidden bg-[#1A1A1A]">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  {product.tag && (
                    <span
                      className="absolute left-3 top-3 rounded px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider"
                      style={{
                        backgroundColor:
                          product.tag === "SOLD OUT"
                            ? "#666"
                            : product.tag === "LIMITED"
                              ? "#7A5FFF"
                              : "#FF4D00",
                        color: "#fff",
                      }}
                    >
                      {product.tag}
                    </span>
                  )}
                </div>
                <div className="mt-2 sm:mt-4">
                  <p className="truncate text-xs font-medium text-white sm:text-base">{product.name}</p>
                  <p className="text-xs text-[#E6C068] sm:text-sm">${product.price}</p>
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-8 text-center sm:mt-12">
            <Link
              href="/shop"
              className="inline-block text-sm uppercase tracking-wider text-white/80 transition-colors hover:text-white"
            >
              View All
            </Link>
          </div>
        </div>
      </section>

      {/* 3. Editorial Section */}
      <section className="border-t border-white/10 bg-[#121212] py-12 sm:py-24">
        <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-8 px-4 sm:gap-12 sm:px-6 md:grid-cols-2 md:gap-16">
          <div className="aspect-[4/5] min-h-[240px] overflow-hidden bg-[#1A1A1A]">
            <img
              src="https://placehold.co/800x1000/1a1a1a/ffffff?text=CRAFTED"
              alt="Editorial"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="flex flex-col justify-center">
            <h2
              className="mb-4 text-2xl font-bold uppercase tracking-tight text-white sm:mb-6 sm:text-3xl md:text-4xl"
              style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
            >
              Crafted for Adventurers
            </h2>
            <p className="mb-4 text-base leading-relaxed text-white/80 sm:mb-6 sm:text-lg">
              Designed for those who walk between realms. Minimal. Timeless.
              Legendary.
            </p>
            <Link
              href="/shop"
              className="inline-block w-fit min-h-[44px] min-w-[120px] border border-white/30 px-6 py-3 text-center text-sm font-medium uppercase tracking-wider text-white transition-colors hover:border-white hover:bg-white/5"
            >
              Explore
            </Link>
          </div>
        </div>
      </section>

      {/* 4. Category Navigation */}
      <section className="border-t border-white/10 bg-[#0A0A0A] py-12 sm:py-20">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
          <h2
            className="mb-8 text-xl font-bold uppercase tracking-tight text-white sm:mb-12 sm:text-2xl md:text-3xl"
            style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
          >
            Shop by Category
          </h2>
          <div className="grid grid-cols-2 gap-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-5">
            {MOCK_CATEGORIES.map((category) => (
              <Link
                key={category.id}
                href={`/shop?category=${category.slug}`}
                className="flex min-h-[72px] aspect-square items-center justify-center border border-white/10 bg-[#1A1A1A] px-2 text-center transition-colors hover:border-white/30 hover:bg-[#1A1A1A]/80"
              >
                <span className="text-xs font-medium uppercase tracking-wider text-white sm:text-sm">
                  {category.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
