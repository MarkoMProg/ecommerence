import Link from "next/link";
import { MOCK_PRODUCTS, MOCK_CATEGORIES } from "@/lib/mock-data";

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category: categoryParam } = await searchParams;
  const categoryFilter = categoryParam ?? "all";

  const filteredProducts =
    categoryFilter === "all"
      ? MOCK_PRODUCTS
      : MOCK_PRODUCTS.filter(
          (p) => p.category.toLowerCase() === categoryFilter.toLowerCase(),
        );

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-10 sm:px-6 sm:py-16">
      <h1
        className="mb-8 text-2xl font-bold uppercase tracking-tight text-white sm:mb-12 sm:text-4xl md:text-5xl"
        style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
      >
        All Items
      </h1>

      {/* Filters — text links */}
      <div className="mb-8 flex flex-wrap gap-3 border-b border-white/10 pb-4 sm:mb-12 sm:gap-6 sm:pb-6">
        <Link
          href="/shop"
          className={`min-h-[44px] py-2 text-xs uppercase tracking-wider transition-colors sm:text-sm ${
            categoryFilter === "all"
              ? "text-[#FF4D00]"
              : "text-white/60 hover:text-white"
          }`}
        >
          All
        </Link>
        {MOCK_CATEGORIES.map((cat) => (
          <Link
            key={cat.id}
            href={`/shop?category=${cat.slug}`}
            className={`min-h-[44px] py-2 text-xs uppercase tracking-wider transition-colors sm:text-sm ${
              categoryFilter === cat.slug
                ? "text-[#FF4D00]"
                : "text-white/60 hover:text-white"
            }`}
          >
            {cat.name}
          </Link>
        ))}
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3 xl:grid-cols-4">
        {filteredProducts.map((product) => (
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
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all duration-300 group-hover:bg-black/40 group-hover:opacity-100">
                <span className="rounded-md border border-white px-6 py-2 text-sm font-medium uppercase tracking-wider text-white">
                  View
                </span>
              </div>
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

      {filteredProducts.length === 0 && (
        <p className="py-20 text-center text-white/60">
          No products in this category.
        </p>
      )}
    </div>
  );
}
