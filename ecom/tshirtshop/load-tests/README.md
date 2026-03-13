# Load Tests — k6

Performance and load tests for the tshirtshop API, written with [k6](https://k6.io).

## Why k6?

| Feature             | k6                                                     |
| ------------------- | ------------------------------------------------------ |
| Script language     | JavaScript (ES6+) — familiar syntax                    |
| Grafana integration | Native — k6 is made by Grafana Labs                    |
| CI/CD friendly      | Single binary, exits with non-zero on threshold breach |
| Free tier           | Fully open-source; Grafana Cloud adds dashboards       |
| Lightweight         | No JVM, no XML config                                  |

---

## 1. Install k6

### Windows (recommended: `winget`)

```powershell
winget install k6 --source winget
```

Or download the MSI from https://github.com/grafana/k6/releases/latest

### macOS

```bash
brew install k6
```

### Linux (Debian/Ubuntu)

```bash
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg \
     --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" \
     | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update && sudo apt-get install k6
```

### Docker

```bash
docker pull grafana/k6
```

---

## 2. Create a test user

Before running authenticated tests, create a persistent test account in your database:

```bash
# From apps/backend/
node scripts/seed.mjs   # or register manually via the UI
```

Then pass the credentials as environment variables when running tests (see below).

---

## 3. Running the tests

All commands are run from the `load-tests/` directory (or pass the file path).

### Smoke test — quick sanity check (1 VU, 2 min)

```powershell
k6 run smoke.js `
  -e BASE_URL=http://localhost:3000 `
  -e TEST_EMAIL=testuser@loadtest.invalid `
  -e TEST_PASSWORD=TestPassword1!
```

### Load test — realistic traffic (up to ~30 VUs, ~9 min)

```powershell
k6 run load.js `
  -e BASE_URL=http://localhost:3000 `
  -e TEST_EMAIL=testuser@loadtest.invalid `
  -e TEST_PASSWORD=TestPassword1!
```

### Stress test — find the breaking point (ramps to 160 VUs)

```powershell
k6 run stress.js `
  -e BASE_URL=http://localhost:3000 `
  -e TEST_EMAIL=testuser@loadtest.invalid `
  -e TEST_PASSWORD=TestPassword1!
```

### Spike test — flash sale simulation (sudden burst to 200 VUs)

```powershell
k6 run spike.js `
  -e BASE_URL=http://localhost:3000 `
  -e TEST_EMAIL=testuser@loadtest.invalid `
  -e TEST_PASSWORD=TestPassword1!
```

---

## 4. Saving results

### JSON output (for custom dashboards or further analysis)

```powershell
k6 run load.js --out json=results/load.json
```

### CSV output

```powershell
k6 run load.js --out csv=results/load.csv
```

---

## 5. Visualising results with Grafana (optional but powerful)

### Option A — Grafana Cloud k6 (easiest)

1. Sign up at https://grafana.com (free tier available)
2. Get your API token from the k6 Cloud dashboard
3. Run:
   ```powershell
   k6 cloud load.js -e TEST_EMAIL=... -e TEST_PASSWORD=...
   ```
   Results appear live in the Grafana Cloud dashboard.

### Option B — Local Grafana + InfluxDB (self-hosted)

Run the full stack with Docker Compose:

```powershell
# From the load-tests/ folder
docker compose -f grafana/docker-compose.yml up -d
```

Then run a test with InfluxDB output:

```powershell
k6 run load.js --out influxdb=http://localhost:8086/k6 `
  -e TEST_EMAIL=... -e TEST_PASSWORD=...
```

Open Grafana at http://localhost:3001 (or 3002 if your frontend is on 3001).
Import the official k6 dashboard: **Grafana Dashboard ID 2587**.

> The `grafana/` subfolder (not yet created) would contain the
> `docker-compose.yml` for InfluxDB + Grafana. See
> https://k6.io/docs/results-output/real-time/influxdb/ for the full setup.

---

## 6. Test files overview

| File         | Purpose                                            | Peak VUs | Duration |
| ------------ | -------------------------------------------------- | -------- | -------- |
| `smoke.js`   | Sanity check — does everything respond?            | 1        | 2 min    |
| `load.js`    | Realistic daily traffic, 3 concurrent scenarios    | ~30      | ~9 min   |
| `stress.js`  | Find the breaking point by ramping up indefinitely | 160      | ~16 min  |
| `spike.js`   | Flash sale burst — instant 10× traffic jump        | 200      | ~8 min   |
| `helpers.js` | Shared utilities imported by all tests             | —        | —        |

---

## 7. Understanding thresholds

Thresholds are defined in each test file and determine pass/fail:

```js
thresholds: {
  http_req_duration: ['p(95)<500'],  // 95th percentile under 500 ms
  http_req_failed:   ['rate<0.01'],  // less than 1% errors
  checks:            ['rate>0.99'],  // 99% of checks pass
}
```

k6 exits with code `99` when a threshold is breached — useful for CI/CD gates.

---

## 8. CI/CD integration (GitHub Actions example)

```yaml
# .github/workflows/load-test.yml
name: Load Test
on:
  workflow_dispatch: # run manually

jobs:
  k6-smoke:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: grafana/setup-k6-action@v1
      - run: k6 run ecom/tshirtshop/load-tests/smoke.js
        env:
          BASE_URL: ${{ secrets.STAGING_API_URL }}
          TEST_EMAIL: ${{ secrets.LOAD_TEST_EMAIL }}
          TEST_PASSWORD: ${{ secrets.LOAD_TEST_PASSWORD }}
```
