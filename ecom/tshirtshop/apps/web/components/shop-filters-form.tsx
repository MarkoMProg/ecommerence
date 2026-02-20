"use client";

export interface ShopFiltersFormProps {
  category?: string;
  searchQuery?: string;
  brandFilter?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
  brands: string[];
}

export function ShopFiltersForm({
  category,
  searchQuery,
  brandFilter,
  minPrice,
  maxPrice,
  sort,
  brands,
}: ShopFiltersFormProps) {
  return (
    <form action="/shop" method="get" className="mb-6 flex flex-wrap items-end gap-4">
      {category && category !== "all" && (
        <input type="hidden" name="category" value={category} />
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
          min={0}
          step={0.01}
          placeholder="0"
          defaultValue={minPrice != null && !Number.isNaN(minPrice) ? minPrice : ""}
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
          min={0}
          step={0.01}
          placeholder="Any"
          defaultValue={maxPrice != null && !Number.isNaN(maxPrice) ? maxPrice : ""}
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
  );
}
