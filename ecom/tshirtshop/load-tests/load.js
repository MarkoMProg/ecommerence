/**
 * LOAD TEST  (average expected traffic)
 * ──────────────────────────────────────
 * Purpose : simulate realistic daily traffic on the storefront.
 * Shape   : ramp up → sustained → ramp down.
 * Scenarios (weighted to match real e-commerce traffic):
 *   • browser (70%) — anonymous product browsing & search
 *   • shopper (20%) — login → browse → add to cart
 *   • reviewer (10%) — login → view orders / account
 *
 * Run:
 *   k6 run load.js
 *   k6 run load.js -e BASE_URL=https://api.yourdomain.com \
 *                  -e TEST_EMAIL=user@example.com \
 *                  -e TEST_PASSWORD=secret
 *
 * To produce a Grafana-compatible JSON report:
 *   k6 run --out json=results/load.json load.js
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
  scenarios: {
    // ── Scenario A: anonymous browser ─────────────────────────────────────
    browser: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "2m", target: 20 }, // ramp up to 20 VUs
        { duration: "5m", target: 20 }, // hold
        { duration: "2m", target: 0 }, // ramp down
      ],
      gracefulRampDown: "30s",
      exec: "browserFlow",
      tags: { scenario: "browser" },
    },

    // ── Scenario B: authenticated shopper ─────────────────────────────────
    shopper: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "2m", target: 6 },
        { duration: "5m", target: 6 },
        { duration: "2m", target: 0 },
      ],
      gracefulRampDown: "30s",
      exec: "shopperFlow",
      tags: { scenario: "shopper" },
    },

    // ── Scenario C: authenticated reviewer ────────────────────────────────
    reviewer: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "2m", target: 3 },
        { duration: "5m", target: 3 },
        { duration: "2m", target: 0 },
      ],
      gracefulRampDown: "30s",
      exec: "reviewerFlow",
      tags: { scenario: "reviewer" },
    },
  },

  thresholds: {
    ...DEFAULT_THRESHOLDS,
    // Scenario-specific thresholds
    "http_req_duration{scenario:browser}": ["p(95)<400"],
    "http_req_duration{scenario:shopper}": ["p(95)<600"],
    "http_req_duration{scenario:reviewer}": ["p(95)<600"],
    checks: ["rate>0.99"],
  },
};

const TEST_EMAIL = __ENV.TEST_EMAIL || "k6-loadtest@loadtest.invalid";
const TEST_PASSWORD = __ENV.TEST_PASSWORD || "LoadTest1!";

// ---------------------------------------------------------------------------
// Scenario A — anonymous browsing
// ---------------------------------------------------------------------------
export function browserFlow() {
  group("anonymous: catalog browse", () => {
    const pid = browseProducts();
    sleep(0.8);
    viewProduct(pid);
    sleep(0.5);
  });

  group("anonymous: category filter", () => {
    const cid = browseCategories();
    sleep(0.5);
    if (cid) {
      browseProducts(cid);
      sleep(0.5);
    }
  });

  group("anonymous: search", () => {
    searchSuggestions(randomSearchTerm());
    sleep(0.3);
  });

  // Simulate page think-time (reading a product description, etc.)
  sleep(Math.random() * 3 + 1);
}

// ---------------------------------------------------------------------------
// Scenario B — authenticated shopper
// ---------------------------------------------------------------------------
export function shopperFlow() {
  let token = null;
  group("shopper: login", () => {
    token = login(TEST_EMAIL, TEST_PASSWORD);
    sleep(0.5);
  });

  group("shopper: browse & find product", () => {
    const pid = browseProducts();
    sleep(1);
    viewProduct(pid);
    sleep(1);

    group("shopper: add to cart", () => {
      addToCart(pid, token);
      sleep(0.5);
    });

    group("shopper: view cart", () => {
      getCart(token);
      sleep(0.5);
    });
  });

  sleep(Math.random() * 2 + 1);
}

// ---------------------------------------------------------------------------
// Scenario C — authenticated reviewer (account / order history)
// ---------------------------------------------------------------------------
export function reviewerFlow() {
  let token = null;
  group("reviewer: login", () => {
    token = login(TEST_EMAIL, TEST_PASSWORD);
    sleep(0.5);
  });

  group("reviewer: view orders", () => {
    getOrders(token);
    sleep(1);
  });

  group("reviewer: browse again", () => {
    browseProducts();
    sleep(1);
  });

  sleep(Math.random() * 2 + 1);
}
