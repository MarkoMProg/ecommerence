/**
 * SPIKE TEST
 * ──────────
 * Purpose : simulate a sudden burst of traffic (e.g. a flash sale, product
 *           launch tweet, or email campaign). Checks whether the API recovers
 *           gracefully after the spike subsides.
 *
 * Shape: normal → instant spike to 10× → back to normal → idle
 *
 * Run:
 *   k6 run spike.js
 *   k6 run spike.js -e BASE_URL=https://api.yourdomain.com
 */

import { sleep, group } from "k6";
import {
  browseProducts,
  viewProduct,
  addToCart,
  login,
  randomSearchTerm,
  searchSuggestions,
} from "./helpers.js";

export const options = {
  stages: [
    { duration: "1m", target: 10 }, // normal baseline
    { duration: "30s", target: 200 }, // spike! (flash sale opens)
    { duration: "3m", target: 200 }, // sustain spike
    { duration: "30s", target: 10 }, // spike subsides
    { duration: "2m", target: 10 }, // recovery — does the API stabilise?
    { duration: "30s", target: 0 }, // ramp down
  ],
  thresholds: {
    // Allow higher latency; what matters is that the API doesn't crash
    http_req_duration: ["p(95)<2000"],
    http_req_failed: ["rate<0.10"], // up to 10% errors tolerated during spike
    checks: ["rate>0.85"],
  },
};

const TEST_EMAIL = __ENV.TEST_EMAIL || "k6-loadtest@loadtest.invalid";
const TEST_PASSWORD = __ENV.TEST_PASSWORD || "LoadTest1!";

export default function () {
  // During a spike, most users just hit the product pages
  const roll = Math.random();

  if (roll < 0.6) {
    // Majority: anonymous product browsing (hot page)
    group("spike: product page", () => {
      const pid = browseProducts();
      sleep(0.2);
      viewProduct(pid);
    });
  } else if (roll < 0.85) {
    // Search load
    group("spike: search", () => {
      searchSuggestions(randomSearchTerm());
    });
  } else {
    // Authenticated add-to-cart (most latency-sensitive)
    group("spike: add to cart", () => {
      const token = login(TEST_EMAIL, TEST_PASSWORD);
      sleep(0.2);
      const pid = browseProducts();
      sleep(0.2);
      addToCart(pid, token);
    });
  }

  // Very short think time during a spike — users are clicking fast
  sleep(Math.random() * 0.5);
}
