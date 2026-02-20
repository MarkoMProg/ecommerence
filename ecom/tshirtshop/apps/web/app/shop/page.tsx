import Link from "next/link";
import { fetchProducts, fetchCategories, fetchBrands } from "@/lib/api/catalog";

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

      {/* Search */}
      <form action="/shop" method="get" className="mb-6 sm:mb-8">
        {categoryFilter !== "all" && (
          <input type="hidden" name="category" value={categoryFilter} />
        )}
        {brandFilter && <input type="hidden" name="brand" value={brandFilter} />}
        {minPrice != null && !Number.isNaN(minPrice) && (
          <input type="hidden" name="minPrice" value={minPrice} />
        )}
        {maxPrice != null && !Number.isNaN(maxPrice) && (
          <input type="hidden" name="maxPrice" value={maxPrice} />
        )}
        {sort && <input type="hidden" name="sort" value={sort} />}
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

      {/* Faceted filters + sort */}
      <form action="/shop" method="get" className="mb-6 flex flex-wrap items-end gap-4">
        {categoryFilter !== "all" && (
          <input type="hidden" name="category" value={categoryFilter} />
        )}
        {searchQuery && <input type="hidden" name="q" value={searchQuery} />}
        <div>
          <label htmlFor="brand" className="mb-1 block text-xs uppercase tracking-widest text-white/60">
            Brand
          </label>
          <select
            id="brand"
            name="brand"
            className="min-h-[44px] rounded-md border border-white/20 bg-[#1A1A1A] px-3 py-2 text-sm text-white focus:border-[#FF4D00] focus:outline-none"
            defaultValue={brandFilter ?? ""}
          >
            <option value="">All</option>
            {brands.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="minPrice" className="mb-1 block text-xs uppercase tracking-widest text-white/60">
            Min $ (USD)
          </label>
          <input
            id="minPrice"
            name="minPrice"
            type="number"
            min="0"
            step="0.01"
            placeholder="0"
            defaultValue={!Number.isNaN(minPrice) ? minPrice : ""}
            className="min-h-[44px] w-24 rounded-md border border-white/20 bg-[#1A1A1A] px-3 py-2 text-sm text-white focus:border-[#FF4D00] focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="maxPrice" className="mb-1 block text-xs uppercase tracking-widest text-white/60">
            Max $ (USD)
          </label>
          <input
            id="maxPrice"
            name="maxPrice"
            type="number"
            min="0"
            step="0.01"
            placeholder="Any"
            defaultValue={!Number.isNaN(maxPrice) ? maxPrice : ""}
            className="min-h-[44px] w-24 rounded-md border border-white/20 bg-[#1A1A1A] px-3 py-2 text-sm text-white focus:border-[#FF4D00] focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="sort" className="mb-1 block text-xs uppercase tracking-widest text-white/60">
            Sort
          </label>
          <select
            id="sort"
            name="sort"
            className="min-h-[44px] rounded-md border border-white/20 bg-[#1A1A1A] px-3 py-2 text-sm text-white focus:border-[#FF4D00] focus:outline-none"
            defaultValue={sort ?? ""}
            onChange={(e) => e.currentTarget.form?.submit()}
          >
            <option value="">Newest</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="name-asc">Name: A–Z</option>
            <option value="name-desc">Name: Z–A</option>
          </select>
        </div>
        <button
          type="submit"
          className="min-h-[44px] rounded-md border border-white/30 px-4 py-2 text-sm font-medium uppercase tracking-wider text-white transition-colors hover:border-white hover:bg-white/5"
        >
          Apply
        </button>
      </form>

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
          {searchQuery ? `No products found for "${searchQuery}".` : "No products in this category."}
        </p>
      )}
    </div>
  );
}
