import Link from "next/link";
import { fetchProducts, fetchCategories } from "@/lib/api/catalog";

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const { category: categoryParam, q: qParam } = await searchParams;
  const categoryFilter = categoryParam ?? "all";
  const searchQuery = qParam?.trim() || undefined;

  let products: Awaited<ReturnType<typeof fetchProducts>>["products"] = [];
  let categories: Awaited<ReturnType<typeof fetchCategories>> = [];

  try {
    const [productsRes, categoriesData] = await Promise.all([
      fetchProducts({
        category: categoryFilter === "all" ? undefined : categoryFilter,
        q: searchQuery,
      }),
      fetchCategories(),
    ]);
    products = productsRes.products;
    categories = categoriesData;
  } catch (err) {
    console.error("[ShopPage] API fetch failed:", err);
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-10 sm:px-6 sm:py-16">
      <h1
        className="mb-6 text-2xl font-bold uppercase tracking-tight text-white sm:mb-8 sm:text-4xl md:text-5xl"
        style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
      >
        {searchQuery ? `Search: "${searchQuery}"` : "All Items"}
      </h1>

      {/* Search */}
      <form
        action="/shop"
        method="get"
        className="mb-6 sm:mb-8"
      >
        {categoryFilter !== "all" && (
          <input type="hidden" name="category" value={categoryFilter} />
        )}
        <div className="flex gap-2">
          <input
            type="search"
            name="q"
            placeholder="Search products..."
            defaultValue={searchQuery}
            className="min-h-[44px] flex-1 rounded-md border border-white/20 bg-[#1A1A1A] px-4 py-2 text-sm text-white placeholder:text-white/50 focus:border-[#FF4D00] focus:outline-none focus:ring-1 focus:ring-[#FF4D00]"
            aria-label="Search products"
          />
          <button
            type="submit"
            className="min-h-[44px] min-w-[44px] rounded-md bg-[#FF4D00] px-4 py-2 text-sm font-medium uppercase tracking-wider text-white transition-colors hover:bg-[#FF4D00]/90"
          >
            Search
          </button>
        </div>
      </form>

      {/* Filters — text links */}
      <div className="mb-8 flex flex-wrap gap-3 border-b border-white/10 pb-4 sm:mb-12 sm:gap-6 sm:pb-6">
        <Link
          href={searchQuery ? `/shop?q=${encodeURIComponent(searchQuery)}` : "/shop"}
          className={`min-h-[44px] py-2 text-xs uppercase tracking-wider transition-colors sm:text-sm ${
            categoryFilter === "all"
              ? "text-[#FF4D00]"
              : "text-white/60 hover:text-white"
          }`}
        >
          All
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/shop?category=${cat.slug}${searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : ""}`}
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
        {products.map((product) => (
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
            </div>
            <div className="mt-2 sm:mt-4">
              <p className="truncate text-xs font-medium text-white sm:text-base">{product.name}</p>
              <p className="text-xs text-[#E6C068] sm:text-sm">${product.price}</p>
            </div>
          </Link>
        ))}
      </div>

      {products.length === 0 && (
        <p className="py-20 text-center text-white/60">
          {searchQuery ? `No products found for "${searchQuery}".` : "No products in this category."}
        </p>
      )}
    </div>
  );
}
