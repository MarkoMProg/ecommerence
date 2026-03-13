/**
 * STRESS TEST
 * ───────────
 * Purpose : find the breaking point — keep increasing load until responses
 *           degrade or errors spike. Useful for capacity planning.
 *
 * Run:
 *   k6 run stress.js
 *   k6 run stress.js -e BASE_URL=https://api.yourdomain.com
 *
 * What to watch:
 *   • At what VU count do p(95) latencies exceed 1 s?
 *   • At what VU count does the error rate climb above 1%?
 */

import { sleep, group } from "k6";
import {
  browseProducts,
  viewProduct,
  browseCategories,
  searchSuggestions,
  login,
  addToCart,
  getCart,
  randomSearchTerm,
} from "./helpers.js";

export const options = {
  stages: [
    { duration: "2m", target: 20 }, // warm up
    { duration: "3m", target: 40 }, // start pushing
    { duration: "3m", target: 80 }, // double the load
    { duration: "3m", target: 120 }, // heavy load
    { duration: "3m", target: 160 }, // near breaking point?
    { duration: "2m", target: 0 }, // recovery ramp-down
  ],
  thresholds: {
    // Stress test is intentionally looser — we want to observe degradation
    http_req_duration: ["p(99)<3000"],
    http_req_failed: ["rate<0.05"], // allow up to 5% errors under stress
    checks: ["rate>0.90"],
  },
};

const TEST_EMAIL = __ENV.TEST_EMAIL || "k6-loadtest@loadtest.invalid";
const TEST_PASSWORD = __ENV.TEST_PASSWORD || "LoadTest1!";

export default function () {
  // Mix of anonymous and authenticated traffic
  const isAuthenticated = Math.random() < 0.25; // ~25% authenticated

  if (isAuthenticated) {
    group("stress: authenticated", () => {
      const token = login(TEST_EMAIL, TEST_PASSWORD);
      sleep(0.3);

      const pid = browseProducts();
      sleep(0.5);

      addToCart(pid, token);
      sleep(0.3);

      getCart(token);
    });
  } else {
    group("stress: anonymous", () => {
      const pid = browseProducts();
      sleep(0.3);

      viewProduct(pid);
      sleep(0.3);

      const cid = browseCategories();
      if (cid) browseProducts(cid);
      sleep(0.3);

      searchSuggestions(randomSearchTerm());
    });
  }

  sleep(Math.random() * 1.5);
}
