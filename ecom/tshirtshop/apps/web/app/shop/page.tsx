import Link from "next/link";
import { Suspense } from "react";
import { fetchProducts, fetchCategories, fetchBrands } from "@/lib/api/catalog";
import { ShopSearchInput } from "@/components/shop-search-input";
import { ShopFiltersForm } from "@/components/shop-filters-form";

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{
    category?: string;
    q?: string;
    brand?: string;
    minPrice?: string;
    maxPrice?: string;
    sort?: string;
  }>;
}) {
  const params = await searchParams;
  const categoryFilter = params.category ?? "all";
  const searchQuery = params.q?.trim() || undefined;
  const brandFilter = params.brand?.trim() || undefined;
  const minPrice = params.minPrice != null ? parseFloat(params.minPrice) : undefined;
  const maxPrice = params.maxPrice != null ? parseFloat(params.maxPrice) : undefined;
  const sort =
    params.sort === "price-asc" ||
    params.sort === "price-desc" ||
    params.sort === "name-asc" ||
    params.sort === "name-desc"
      ? params.sort
      : undefined;

  let products: Awaited<ReturnType<typeof fetchProducts>>["products"] = [];
  let categories: Awaited<ReturnType<typeof fetchCategories>> = [];
  let brands: string[] = [];
  let apiUnreachable = false;

  try {
    const [productsRes, categoriesData, brandsData] = await Promise.all([
      fetchProducts({
        category: categoryFilter === "all" ? undefined : categoryFilter,
        q: searchQuery,
        brand: brandFilter,
        minPrice: !Number.isNaN(minPrice) && minPrice != null ? minPrice : undefined,
        maxPrice: !Number.isNaN(maxPrice) && maxPrice != null ? maxPrice : undefined,
        sort,
      }),
      fetchCategories(),
      fetchBrands(),
    ]);
    products = productsRes.products;
    categories = categoriesData;
    brands = brandsData;
  } catch (err) {
    console.error("[ShopPage] API fetch failed:", err);
    apiUnreachable = true;
  }

  function buildShopQuery(overrides: {
    category?: string;
    q?: string;
    brand?: string;
    minPrice?: number;
    maxPrice?: number;
    sort?: string;
  }): string {
    const category = overrides.category ?? (categoryFilter === "all" ? undefined : categoryFilter);
    const q = overrides.q ?? searchQuery;
    const brand = overrides.brand ?? brandFilter;
    const mp = overrides.minPrice ?? (minPrice != null && !Number.isNaN(minPrice) ? minPrice : undefined);
    const mx = overrides.maxPrice ?? (maxPrice != null && !Number.isNaN(maxPrice) ? maxPrice : undefined);
    const s = overrides.sort ?? sort;
    const sp = new URLSearchParams();
    if (category && category !== "all") sp.set("category", category);
    if (q) sp.set("q", q);
    if (brand) sp.set("brand", brand);
    if (mp != null) sp.set("minPrice", String(mp));
    if (mx != null) sp.set("maxPrice", String(mx));
    if (s) sp.set("sort", s);
    const qs = sp.toString();
    return qs ? `/shop?${qs}` : "/shop";
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-10 sm:px-6 sm:py-16">
      <h1
        className="mb-6 text-2xl font-bold uppercase tracking-tight text-white sm:mb-8 sm:text-4xl md:text-5xl"
        style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
      >
        {searchQuery ? `Search: "${searchQuery}"` : "All Items"}
      </h1>

      {/* Search with autocomplete suggestions */}
      <div className="mb-6 sm:mb-8">
        <ShopSearchInput
          defaultValue={searchQuery ?? ""}
          category={categoryFilter !== "all" ? categoryFilter : undefined}
          brand={brandFilter}
          minPrice={minPrice != null && !Number.isNaN(minPrice) ? minPrice : undefined}
          maxPrice={maxPrice != null && !Number.isNaN(maxPrice) ? maxPrice : undefined}
          sort={sort}
        />
      </div>

      {/* Faceted filters + sort — wrapped in Suspense (uses useSearchParams) */}
      <Suspense fallback={<div className="mb-6 h-[120px]" />}>
        <ShopFiltersForm
        category={categoryFilter !== "all" ? categoryFilter : undefined}
        searchQuery={searchQuery}
        brandFilter={brandFilter}
        minPrice={minPrice != null && !Number.isNaN(minPrice) ? minPrice : undefined}
        maxPrice={maxPrice != null && !Number.isNaN(maxPrice) ? maxPrice : undefined}
        sort={sort}
        brands={brands}
        />
      </Suspense>

      {/* Category filters — text links */}
      <div className="mb-8 flex flex-wrap gap-3 border-b border-white/10 pb-4 sm:mb-12 sm:gap-6 sm:pb-6">
        <Link
          href={buildShopQuery({ category: "all" })}
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
            href={buildShopQuery({ category: cat.slug })}
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
          {apiUnreachable
            ? "Catalog API unreachable. Is the backend running? Start it with: cd apps/backend && npm run dev"
            : searchQuery
              ? `No products found for "${searchQuery}".`
              : "No products in this category."}
        </p>
      )}
    </div>
  );
}
