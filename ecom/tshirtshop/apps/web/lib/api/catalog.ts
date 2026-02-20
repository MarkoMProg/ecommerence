/**
 * Catalog API client.
 * Fetches from backend. Always uses absolute URLs (required for Node fetch).
 */
function apiUrl(path: string): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}${path}`;
  }
  const base = process.env.API_URL || "http://localhost:3000";
  return `${base}${path}`;
}

export interface ApiCategory {
  id: string;
  name: string;
  slug: string;
}

export interface ApiProductImage {
  id: string;
  productId: string;
  imageUrl: string;
  isPrimary: boolean;
}

export interface ApiProduct {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  stockQuantity: number;
  categoryId: string;
  brand: string;
  images: ApiProductImage[];
  category: ApiCategory | null;
}

export interface ApiErrorPayload {
  code?: string;
  message?: string;
}

export interface ApiProductsResponse {
  success: boolean;
  data: ApiProduct[];
  pagination: { page: number; limit: number; total: number };
  error?: ApiErrorPayload;
}

export interface ApiCategoriesResponse {
  success: boolean;
  data: ApiCategory[];
  error?: ApiErrorPayload;
}

export interface ApiProductResponse {
  success: boolean;
  data: ApiProduct | null;
  error?: ApiErrorPayload;
}

/** Shape used by frontend components (price in dollars, primary image) */
export interface ProductDisplay {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  category: string;
  description?: string;
}

function mapProduct(p: ApiProduct): ProductDisplay {
  const primaryImage = p.images.find((i) => i.isPrimary) ?? p.images[0];
  return {
    id: p.id,
    name: p.name,
    price: p.priceCents / 100,
    imageUrl: primaryImage?.imageUrl ?? '',
    category: p.category?.slug ?? '',
    description: p.description,
  };
}

function getFetchErrorDetail(err: unknown): string {
  if (err instanceof AggregateError && err.errors?.length) {
    return err.errors.map((e) => (e instanceof Error ? e.message : String(e))).join("; ");
  }
  if (err instanceof Error) {
    return err.cause instanceof Error ? err.cause.message : err.message;
  }
  return String(err);
}

async function fetchApi(url: string): Promise<Response> {
  try {
    return await fetch(url, { cache: "no-store" });
  } catch (err) {
    const detail = getFetchErrorDetail(err);
    throw new Error(
      `Catalog API unreachable at ${url}. Is the backend running? (${detail})`,
      { cause: err instanceof Error ? err : undefined },
    );
  }
}

export async function fetchCategories(): Promise<ApiCategory[]> {
  const url = apiUrl("/api/v1/categories");
  const res = await fetchApi(url);
  if (!res.ok) throw new Error(`Categories fetch failed: ${res.status}`);
  const json = (await res.json()) as ApiCategoriesResponse;
  if (!json.success) throw new Error(json.error?.message ?? "Categories fetch failed");
  return json.data;
}

export interface SearchSuggestions {
  products: string[];
  categories: { name: string; slug: string }[];
  brands: string[];
}

/** Search suggestions for autocomplete. Call from client only (uses fetch with relative path). */
export async function fetchSearchSuggestions(
  q: string,
  limit = 10,
): Promise<SearchSuggestions> {
  const trimmed = q?.trim() ?? "";
  if (trimmed.length < 2) {
    return { products: [], categories: [], brands: [] };
  }
  const base = typeof window !== "undefined" ? window.location.origin : process.env.API_URL || "http://localhost:3000";
  const url = `${base}/api/v1/products/suggestions?q=${encodeURIComponent(trimmed)}&limit=${limit}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return { products: [], categories: [], brands: [] };
  const json = (await res.json()) as { success: boolean; data: SearchSuggestions };
  return json.success ? json.data : { products: [], categories: [], brands: [] };
}

export async function fetchBrands(): Promise<string[]> {
  const url = apiUrl("/api/v1/products/brands");
  const res = await fetchApi(url);
  if (!res.ok) throw new Error(`Brands fetch failed: ${res.status}`);
  const json = (await res.json()) as { success: boolean; data: string[]; error?: ApiErrorPayload };
  if (!json.success) throw new Error(json.error?.message ?? "Brands fetch failed");
  return json.data;
}

export async function fetchProducts(options?: {
  page?: number;
  limit?: number;
  category?: string;
  q?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: 'newest' | 'price-asc' | 'price-desc' | 'name-asc' | 'name-desc';
}): Promise<{ products: ProductDisplay[]; pagination: { page: number; limit: number; total: number } }> {
  const params = new URLSearchParams();
  if (options?.page) params.set('page', String(options.page));
  if (options?.limit) params.set('limit', String(options.limit));
  if (options?.category) params.set('category', options.category);
  if (options?.q?.trim()) params.set('q', options.q.trim());
  if (options?.brand?.trim()) params.set('brand', options.brand.trim());
  if (options?.minPrice != null && options.minPrice >= 0) params.set('minPrice', String(options.minPrice));
  if (options?.maxPrice != null && options.maxPrice >= 0) params.set('maxPrice', String(options.maxPrice));
  if (options?.sort) params.set('sort', options.sort);
  const qs = params.toString();
  const url = apiUrl(`/api/v1/products${qs ? `?${qs}` : ''}`);
  const res = await fetchApi(url);
  if (!res.ok) throw new Error(`Products fetch failed: ${res.status}`);
  const json = (await res.json()) as ApiProductsResponse;
  if (!json.success) throw new Error(json.error?.message ?? 'Products fetch failed');
  return {
    products: json.data.map(mapProduct),
    pagination: json.pagination,
  };
}

export async function fetchProduct(id: string): Promise<ProductDisplay | null> {
  const url = apiUrl(`/api/v1/products/${id}`);
  const res = await fetchApi(url);
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(`Product fetch failed: ${res.status}`);
  }
  const json = (await res.json()) as ApiProductResponse;
  if (!json.success || !json.data) return null;
  return mapProduct(json.data);
}
