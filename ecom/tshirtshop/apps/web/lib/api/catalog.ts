/**
 * Catalog API client.
 * Fetches from backend. Server components require absolute URLs.
 * WARNING: Relative URLs fail in RSC — server has no host context.
 */
const API_BASE =
  typeof window !== "undefined"
    ? "" // Client: use same origin (rewrite proxies to backend)
    : process.env.API_URL || "http://localhost:3000";

function apiUrl(path: string): string {
  return API_BASE ? `${API_BASE}${path}` : path;
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

export interface ApiProductsResponse {
  success: boolean;
  data: ApiProduct[];
  pagination: { page: number; limit: number; total: number };
}

export interface ApiCategoriesResponse {
  success: boolean;
  data: ApiCategory[];
}

export interface ApiProductResponse {
  success: boolean;
  data: ApiProduct | null;
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

async function fetchApi(url: string): Promise<Response> {
  try {
    return await fetch(url, { cache: "no-store" });
  } catch (err) {
    const cause = err instanceof Error ? err.cause ?? err.message : String(err);
    throw new Error(
      `Catalog API unreachable at ${url}. Is the backend running? (${cause})`,
      { cause: err instanceof Error ? err : undefined },
    );
  }
}

export async function fetchCategories(): Promise<ApiCategory[]> {
  const url = apiUrl("/api/v1/categories");
  const res = await fetchApi(url);
  if (!res.ok) throw new Error(`Categories fetch failed: ${res.status}`);
  const json = (await res.json()) as ApiCategoriesResponse;
  if (!json.success) throw new Error(json.error?.message ?? 'Categories fetch failed');
  return json.data;
}

export async function fetchProducts(options?: {
  page?: number;
  limit?: number;
  category?: string;
  /** Search query: case-insensitive match on name and description */
  q?: string;
}): Promise<{ products: ProductDisplay[]; pagination: { page: number; limit: number; total: number } }> {
  const params = new URLSearchParams();
  if (options?.page) params.set('page', String(options.page));
  if (options?.limit) params.set('limit', String(options.limit));
  if (options?.category) params.set('category', options.category);
  if (options?.q?.trim()) params.set('q', options.q.trim());
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
