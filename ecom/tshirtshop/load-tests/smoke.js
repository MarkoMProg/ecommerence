/**
 * SMOKE TEST
 * ----------
 * Purpose: quickly verify nothing is broken before a heavier test run.
 * Load   : 1 virtual user, 2 minutes.
 * Pass   : all checks pass, response times are sane.
 *
 * Run:
 *   k6 run smoke.js
 *   k6 run smoke.js -e BASE_URL=https://api.yourdomain.com
 */

import { sleep, group } from "k6";
import {
  DEFAULT_THRESHOLDS,
  browseProducts,
  viewProduct,
  searchSuggestions,
  browseCategories,
  login,
  getCart,
  addToCart,
  getOrders,
  randomSearchTerm,
} from "./helpers.js";

// ---------------------------------------------------------------------------
// Test configuration
// ---------------------------------------------------------------------------
export const options = {
  vus: 1,
  duration: "2m",
  thresholds: {
    ...DEFAULT_THRESHOLDS,
    // Even stricter during smoke: 100% checks must pass
    checks: ["rate==1.0"],
  },
};

// ---------------------------------------------------------------------------
// Credentials of an existing test user
// Set via env vars so they are never hard-coded:
//   k6 run smoke.js -e TEST_EMAIL=user@example.com -e TEST_PASSWORD=secret
// ---------------------------------------------------------------------------
const TEST_EMAIL = __ENV.TEST_EMAIL || "k6-loadtest@loadtest.invalid";
const TEST_PASSWORD = __ENV.TEST_PASSWORD || "LoadTest1!";

// ---------------------------------------------------------------------------
// Main VU function — runs once per iteration
// ---------------------------------------------------------------------------
export default function () {
  // ── 1. Anonymous browsing ──────────────────────────────────────────────
  group("anonymous: browse catalog", () => {
    const productId = browseProducts();
    sleep(0.5);

    viewProduct(productId);
    sleep(0.5);
  });

  // ── 2. Categories ──────────────────────────────────────────────────────
  group("anonymous: categories", () => {
    const categoryId = browseCategories();
    sleep(0.3);

    if (categoryId) {
      browseProducts(categoryId);
    }
    sleep(0.3);
  });

  // ── 3. Search ──────────────────────────────────────────────────────────
  group("anonymous: search", () => {
    searchSuggestions(randomSearchTerm());
    sleep(0.3);
  });

  // ── 4. Authenticated flow ──────────────────────────────────────────────
  group("auth: login + cart + orders", () => {
    const token = login(TEST_EMAIL, TEST_PASSWORD);
    sleep(0.5);

    if (token) {
      const productId = browseProducts();
      sleep(0.3);

      addToCart(productId, token);
      sleep(0.3);

      getCart(token);
      sleep(0.3);

      getOrders(token);
      sleep(0.5);
    }
  });

  sleep(1);
}
