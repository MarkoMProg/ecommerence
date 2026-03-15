/**
 * Catalog API client.
 * Fetches from backend. Always uses absolute URLs (required for Node fetch).
 */
async function trustedFetch(urlString: string, init?: RequestInit): Promise<Response> {
  const url = new URL(urlString);

  if (typeof window !== "undefined" || url.protocol !== "https:") {
    return fetch(urlString, init);
  }

  const http = process.getBuiltinModule("http") as typeof import("http");
  const https = process.getBuiltinModule("https") as typeof import("https");
  const fs = process.getBuiltinModule("fs") as typeof import("fs");
  const path = process.getBuiltinModule("path") as typeof import("path");

  const mkcertCaRoot = path.join(
    process.env.LOCALAPPDATA || "C:\\Users\\nissa\\AppData\\Local",
    "mkcert",
    "rootCA.pem",
  );
  const devCA =
    process.env.NODE_ENV !== "production" && fs.existsSync(mkcertCaRoot)
      ? fs.readFileSync(mkcertCaRoot)
      : undefined;

  const method = init?.method || "GET";
  const headers = new Headers(init?.headers);
  headers.delete("content-length");

  let bodyBuffer: Buffer | undefined;
  if (init?.body != null && method !== "GET" && method !== "HEAD") {
    if (typeof init.body === "string") {
      bodyBuffer = Buffer.from(init.body);
    } else if (init.body instanceof URLSearchParams) {
      bodyBuffer = Buffer.from(init.body.toString());
    } else if (init.body instanceof ArrayBuffer) {
      bodyBuffer = Buffer.from(init.body);
    } else if (ArrayBuffer.isView(init.body)) {
      bodyBuffer = Buffer.from(init.body.buffer, init.body.byteOffset, init.body.byteLength);
    } else if (init.body instanceof Blob) {
      bodyBuffer = Buffer.from(await init.body.arrayBuffer());
    } else {
      throw new Error("Unsupported request body type");
    }
  }

  return new Promise<Response>((resolve, reject) => {
    const transport = url.protocol === "https:" ? https : http;
    const request = transport.request(
      {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port ? Number(url.port) : url.protocol === "https:" ? 443 : 80,
        path: `${url.pathname}${url.search}`,
        method,
        headers: Object.fromEntries(headers.entries()),
        ...(devCA ? { ca: devCA } : {}),
      },
      (response) => {
        const chunks: Buffer[] = [];
        response.on("data", (chunk: Buffer) => chunks.push(chunk));
        response.on("end", () => {
          const responseHeaders = new Headers();
          for (const [key, value] of Object.entries(response.headers)) {
            if (typeof value === "undefined") continue;
            if (Array.isArray(value)) {
              for (const item of value) responseHeaders.append(key, item);
            } else {
              responseHeaders.set(key, value);
            }
          }

          resolve(
            new Response(Buffer.concat(chunks), {
              status: response.statusCode || 502,
              statusText: response.statusMessage,
              headers: responseHeaders,
            }),
          );
        });
      },
    );

    request.on("error", reject);
    if (bodyBuffer) request.write(bodyBuffer);
    request.end();
  });
}

function apiUrl(path: string): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}${path}`;
  }
  // Use 127.0.0.1 to avoid Windows IPv6 localhost resolution issues (ECONNREFUSED)
  const base = process.env.API_URL || "http://127.0.0.1:3000";
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
  slug: string;
  description: string;
  priceCents: number;
  stockQuantity: number;
  categoryId: string;
  brand: string;
  weightMetric: string | null;
  weightImperial: string | null;
  dimensionMetric: string | null;
  dimensionImperial: string | null;
  /** Comma-separated sizes, e.g. "XS,S,M,L,XL". Null = product has no size selection. */
  sizeOptions: string | null;
  material: string | null;
  fit: string | null;
  careInstructions: string | null;
  orientation: string | null;
  framingInfo: string | null;
  images: ApiProductImage[];
  category: ApiCategory | null;
  /** REV-003: aggregated from reviews */
  averageRating?: number;
  reviewCount?: number;
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

/** Shape used by frontend components (price in dollars, primary image, and all product attributes) */
export interface ProductDisplay {
  id: string;
  slug: string;
  name: string;
  price: number;
  imageUrl: string;
  category: string;
  description?: string;
  brand: string;
  weightMetric: string | null;
  weightImperial: string | null;
  dimensionMetric: string | null;
  dimensionImperial: string | null;
  /**
   * Parsed size options array. Null = product has no sizes (no selector shown).
   * Derived from the comma-separated `sizeOptions` string returned by the API.
   */
  sizeOptions: string[] | null;
  material: string | null;
  fit: string | null;
  careInstructions: string | null;
  orientation: string | null;
  framingInfo: string | null;
  /** Current available stock. 0 = out of stock. */
  stockQuantity: number;
  /** REV-003: average star rating 0–5, number of reviews */
  averageRating?: number;
  reviewCount?: number;
}

function parseSizeOptions(raw: string | null | undefined): string[] | null {
  if (!raw?.trim()) return null;
  const parts = raw.split(',').map((s) => s.trim()).filter(Boolean);
  return parts.length > 0 ? parts : null;
}

function normalizeImageUrl(url: string | undefined): string {
  if (!url) return '';
  return url
    .replace('http://localhost:3000/', 'https://localhost:3000/')
    .replace('http://127.0.0.1:3000/', 'https://127.0.0.1:3000/');
}

/** Maps API product shape to ProductDisplay. Exported for reuse (e.g. cart recommendations). */
export function mapProduct(p: ApiProduct): ProductDisplay {
  const primaryImage = p.images.find((i) => i.isPrimary) ?? p.images[0];
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    price: p.priceCents / 100,
    imageUrl: normalizeImageUrl(primaryImage?.imageUrl),
    category: p.category?.slug ?? '',
    description: p.description,
    brand: p.brand,
    weightMetric: p.weightMetric ?? null,
    weightImperial: p.weightImperial ?? null,
    dimensionMetric: p.dimensionMetric ?? null,
    dimensionImperial: p.dimensionImperial ?? null,
    sizeOptions: parseSizeOptions(p.sizeOptions),
    material: p.material ?? null,
    fit: p.fit ?? null,
    careInstructions: p.careInstructions ?? null,
    orientation: p.orientation ?? null,
    framingInfo: p.framingInfo ?? null,
    stockQuantity: p.stockQuantity ?? 0,
    averageRating: p.averageRating,
    reviewCount: p.reviewCount,
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
    return await trustedFetch(url, { cache: "no-store" });
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
  const base = typeof window !== "undefined" ? window.location.origin : process.env.API_URL || "http://127.0.0.1:3000";
  const url = `${base}/api/v1/products/suggestions?q=${encodeURIComponent(trimmed)}&limit=${limit}`;
  const res = await trustedFetch(url, { cache: "no-store" });
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
  sort?: 'newest' | 'price-asc' | 'price-desc' | 'name-asc' | 'name-desc' | 'rating-desc';
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
