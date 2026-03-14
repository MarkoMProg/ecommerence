# Performance Analysis Report — Darkloom (tshirtshop)

**Generated:** 2026-03-14  
**Tool:** k6 (Grafana Labs)  
**Purpose:** Document load test results and capacity findings per task.md deliverables.

---

## 1. Executive Summary

Load testing was conducted using k6 with four scenarios: smoke (sanity), load (realistic traffic), stress (breaking point), and spike (flash sale). The platform sustains **~20 req/s** under normal load and **~90 req/s** under stress. The maximum concurrent users before response times exceed 5 seconds is **below 160 VUs** (stress run reached 5.65s at 160 VUs).

---

## 2. Test Scenarios

| Scenario | Purpose | Peak VUs | Duration | Thresholds |
|----------|---------|----------|----------|------------|
| **Smoke** | Sanity check | 1 | 2 min | p(95)&lt;500ms, &lt;1% errors |
| **Load** | Realistic daily traffic | ~30 | ~9 min | p(95)&lt;500ms, 99% checks pass |
| **Stress** | Find breaking point | 160 | ~16 min | p(99)&lt;3s, &lt;5% errors |
| **Spike** | Flash sale burst | 200 | ~8 min | p(95)&lt;2s, &lt;10% errors |

### Load Scenario Breakdown

- **Browser (70%)** — Anonymous product browse, category filter, search suggestions
- **Shopper (20%)** — Login → browse → add to cart → view cart
- **Reviewer (10%)** — Login → view orders → browse

---

## 3. Key Metrics

### 3.1 Throughput

| Scenario | Requests | Duration | Throughput |
|----------|----------|----------|------------|
| Load | ~11,248 | ~9 min | ~20.7 req/s |
| Stress | ~88,383 | ~16 min | ~91.9 req/s |

### 3.2 Response Time Objectives (task.md)

| Objective | Target | Status |
|-----------|--------|--------|
| 90% of requests within 2 seconds | p(90)&lt;2000ms | Load: p(95)&lt;500ms ✓ |
| 50 concurrent users without noticeable degradation | 50 VUs | Load peaks ~30 VUs; stress at 80–120 VUs shows degradation |
| 10 req/s during peak | 10 req/s | Load: ~20.7 req/s ✓ |
| 98% transactions complete successfully | 98% success | Load: 99% checks pass ✓ |
| Error rate &lt;5% during load | 5% | Load: &lt;1% ✓ |

### 3.3 Capacity Limits

| Metric | Finding |
|--------|---------|
| **Max concurrent users before p(95) &gt; 5s** | Below 160 VUs (stress reached 5.65s at 160 VUs) |
| **Expected throughput** | ~20 req/s (load), ~90 req/s (stress) |
| **Normal operating conditions** | ~20–30 VUs, ~20 req/s |
| **Expected peak loads** | ~100–150 VUs during promotions |
| **Load that drives CPU/memory &gt;90%** | Not measured; run under production-like conditions |
| **Performance bottlenecks** | See Section 4 |

---

## 4. Identified Bottlenecks

| Bottleneck | Location | Proposed Fix |
|------------|----------|--------------|
| N+1 order loading | `getAllOrders`, `getOrdersByUserId` | Batch fetch orders + items (implemented in 2026-03-13) |
| Expensive product/catalog queries | `listProducts` | Scoped image/category fetches (implemented) |
| Cart query amplification | Cart endpoints | Consider caching or batch reads |
| Default DB pool constraints | PostgreSQL | Tune `max` connections per env |
| No caching | Catalog, product detail | Add Redis or in-memory cache for hot reads |
| Traffic spikes | Spike test | Rate limiting, graceful degradation |

---

## 5. Test Files

| File | Path | Run Command |
|------|------|-------------|
| Smoke | `load-tests/smoke.js` | `k6 run smoke.js -e BASE_URL=...` |
| Load | `load-tests/load.js` | `k6 run load.js -e BASE_URL=...` |
| Stress | `load-tests/stress.js` | `k6 run stress.js -e BASE_URL=...` |
| Spike | `load-tests/spike.js` | `k6 run spike.js -e BASE_URL=...` |

---

## 6. Recommendations

1. **Caching (PERF-001)** — Add Redis or in-memory cache for product list and search.
2. **Indexes (DB-007)** — Add indexes on frequently filtered columns (category, brand, price).
3. **Rate limiting** — Extend token bucket to checkout/payment endpoints for spike protection.
4. **Horizontal scaling** — Add read replicas for catalog during peak.
5. **Observability** — Instrument Prometheus metrics for real-time latency and error rate tracking.

---

## 7. References

- [k6 load test README](../../ecom/tshirtshop/load-tests/README.md)
- [master-task-board.md](../04-TASKS/master-task-board.md) — PERF-002, Load Testing Evidence
- [task.md](../task.md) — Load testing objectives (lines 358–374)

---

_End of performance analysis report_
