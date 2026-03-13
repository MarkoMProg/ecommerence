/**
 * Shared helpers for k6 load tests.
 * Import what you need in each test file.
 */
import { check, group } from "k6";
import http from "k6/http";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

export const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";

/** Common JSON request headers */
export const JSON_HEADERS = { "Content-Type": "application/json" };

/**
 * Default thresholds you can spread into any scenario's options.
 * Override per-scenario as needed.
 */
export const DEFAULT_THRESHOLDS = {
  // 95% of requests must finish within 500 ms
  http_req_duration: ["p(95)<500", "p(99)<1500"],
  // Error rate must stay below 1%
  http_req_failed: ["rate<0.01"],
};

// ---------------------------------------------------------------------------
// Random data generators
// ---------------------------------------------------------------------------

const ADJECTIVES = ["speedy", "jolly", "brave", "clever", "witty", "swift"];
const NOUNS = ["panda", "falcon", "otter", "badger", "koala", "lynx"];

/** Generates a unique-enough email for test registrations */
export function randomEmail() {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num = Math.floor(Math.random() * 100000);
  return `${adj}.${noun}.${num}@loadtest.invalid`;
}

export function randomName() {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  return `${adj} ${noun}`;
}

const SEARCH_TERMS = [
  "shirt",
  "tee",
  "black",
  "white",
  "large",
  "slim",
  "cotton",
  "logo",
];

export function randomSearchTerm() {
  return SEARCH_TERMS[Math.floor(Math.random() * SEARCH_TERMS.length)];
}

// ---------------------------------------------------------------------------
// Reusable flow helpers
// ---------------------------------------------------------------------------

/**
 * Hits the product list endpoint and returns the first product's ID (or null).
 * @param {string} [category] - optional category slug filter
 */
export function browseProducts(category) {
  const url = category
    ? `${BASE_URL}/api/v1/products?limit=20&category=${category}`
    : `${BASE_URL}/api/v1/products?limit=20`;

  const res = http.get(url);

  check(res, {
    "products list: status 200": (r) => r.status === 200,
    "products list: has data array": (r) => {
      try {
        return Array.isArray(r.json("data"));
      } catch {
        return false;
      }
    },
  });

  try {
    const items = res.json("data");
    if (Array.isArray(items) && items.length > 0) {
      return items[Math.floor(Math.random() * items.length)].id;
    }
  } catch (_) {
    /* ignore */
  }

  return null;
}

/**
 * Fetches a single product detail page.
 */
export function viewProduct(productId) {
  if (!productId) return;
  const res = http.get(`${BASE_URL}/api/v1/products/${productId}`);
  check(res, {
    "product detail: status 200": (r) => r.status === 200,
  });
}

/**
 * Hits the search suggestions endpoint.
 */
export function searchSuggestions(q) {
  const res = http.get(
    `${BASE_URL}/api/v1/products/suggestions?q=${encodeURIComponent(q)}&limit=8`,
  );
  check(res, {
    "suggestions: status 200": (r) => r.status === 200,
  });
}

/**
 * Fetches all categories and returns a random category id (or null).
 */
export function browseCategories() {
  const res = http.get(`${BASE_URL}/api/v1/categories`);

  check(res, {
    "categories: status 200": (r) => r.status === 200,
  });

  try {
    const items = res.json("data");
    if (Array.isArray(items) && items.length > 0) {
      return items[Math.floor(Math.random() * items.length)].id;
    }
  } catch (_) {
    /* ignore */
  }

  return null;
}

/**
 * Logs in with the given credentials using BetterAuth's native sign-in endpoint.
 * Returns the bearer token string on success, or null on failure.
 * Pass the returned token to addToCart / getCart / getOrders as the `token` param.
 */
export function login(email, password) {
  const res = http.post(
    `${BASE_URL}/api/auth/sign-in/email`,
    JSON.stringify({ email, password }),
    { headers: JSON_HEADERS },
  );

  const ok = check(res, {
    "login: status 200": (r) => r.status === 200,
    "login: returns user": (r) => {
      try {
        return !!r.json("user");
      } catch {
        return false;
      }
    },
  });

  if (!ok) return null;
  try {
    return res.json("token") || null;
  } catch (_) {
    return null;
  }
}

/**
 * Registers a new account. Useful in setup() or as a one-off flow.
 * Returns { email, password } so you can log in immediately after.
 */
export function register(name, email, password) {
  const res = http.post(
    `${BASE_URL}/api/v1/auth/register`,
    JSON.stringify({ name, email, password }),
    { headers: JSON_HEADERS },
  );

  check(res, {
    "register: status 201": (r) => r.status === 201,
  });

  return { email, password };
}

/**
 * Builds auth headers from a bearer token.
 * @param {string|null} token
 */
function authHeaders(token) {
  if (!token) return JSON_HEADERS;
  return { ...JSON_HEADERS, Authorization: `Bearer ${token}` };
}

/**
 * Fetches the authenticated user's cart and returns its id (or null).
 * @param {string|null} token - bearer token from login()
 */
export function getCart(token) {
  const res = http.get(`${BASE_URL}/api/v1/cart`, {
    headers: authHeaders(token),
  });
  check(res, {
    "cart: status 200": (r) => r.status === 200,
  });

  try {
    return res.json("data.id") || null;
  } catch (_) {
    return null;
  }
}

/**
 * Adds a product to the cart.
 * @param {string} productId
 * @param {string|null} token - bearer token from login()
 * @param {string} [selectedOption] - e.g. 'M', 'L', 'XL'
 */
export function addToCart(productId, token, selectedOption = "M") {
  if (!productId) return;
  const res = http.post(
    `${BASE_URL}/api/v1/cart/items`,
    JSON.stringify({
      productId,
      quantity: 1,
      selectedOption,
    }),
    { headers: authHeaders(token) },
  );

  check(res, {
    "add to cart: status 200 or 201": (r) =>
      r.status === 200 || r.status === 201,
  });
}

/**
 * Fetches the authenticated user's orders.
 * @param {string|null} token - bearer token from login()
 */
export function getOrders(token) {
  const res = http.get(`${BASE_URL}/api/v1/orders`, {
    headers: authHeaders(token),
  });
  check(res, {
    "orders: status 200": (r) => r.status === 200,
  });
}
