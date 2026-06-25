# Olist Sales Dashboard

Sales performance dashboard for a Brazilian e-commerce operation. Built on Olist's public dataset — about 100k orders placed between 2016 and 2018 across multiple marketplaces.

The point of this project isn't just to visualize data. It's to show how you'd actually build something like this in a company: clean data layers, a backend that enforces business rules, a frontend that doesn't talk directly to the database, and infrastructure you can hand off to someone else without a 30-minute onboarding call.

---

## Getting the data

The Olist dataset lives on Kaggle. Download it and drop these files into `./data/`:

```
data/
├── olist_orders_dataset.csv
├── olist_order_items_dataset.csv
├── olist_order_payments_dataset.csv
├── olist_products_dataset.csv
├── olist_customers_dataset.csv
├── olist_sellers_dataset.csv
└── product_category_name_translation.csv
```

If a file is missing the ETL tells you which one. It won't silently load partial data.

## Running it

```bash
docker compose up --build
```

Docker handles everything: starts Postgres, waits for it to be healthy, runs the ETL (schema creation → CSV load → clean → gold star schema), then starts the API and the frontend. First build takes a few minutes because of the CSV load. Subsequent runs are fast.

| | URL |
|--|--|
| Dashboard | http://localhost:3000 |
| API | http://localhost:3001 |

## Local development (skipping Docker)

```bash
# Just the database
docker compose up db -d

# Backend
cd backend
npm install
npx prisma generate
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/olist \
DATA_DIR=../data \
npm run etl
npm run dev

# Frontend (separate terminal)
cd frontend
npm install
NEXT_PUBLIC_API_URL=http://localhost:3001 npm run dev
```

The ETL is idempotent — run it again if you want to reload the data from scratch. It truncates and rebuilds.

## Tests

```bash
cd backend && npm test
```

Ten tests across four files. Three unit test suites cover the use cases (no database involved — all repositories are mocked). One integration suite covers the HTTP layer end-to-end, also with a mocked Prisma client.

---

## How it's structured

The backend uses hexagonal architecture. The short version: the business logic doesn't know Express exists, and it doesn't know Prisma exists. It only knows about interfaces. This means if you swap the database tomorrow, you rewrite the repositories — not the business rules.

```
Request → Controller (Zod validation)
            → Use Case (business rules)
               → Repository interface
                  → Prisma $queryRaw
                     → gold.fact_sales
```

Data goes through three PostgreSQL schemas before the API touches it:

| Schema | What it is |
|--------|-----------|
| `raw` | Exact copy of the CSVs. All TEXT. If Olist changes their export format, this is the only thing that breaks. |
| `clean` | Proper types, null handling, payments aggregated per order, duplicates removed. |
| `gold` | Star schema. The only schema the API is allowed to query. |

The API can't accidentally serve stale or malformed data because it only reads from gold, and gold is only built from clean data.

## Star schema

One row per order item (`order_id + order_item_id`).

```
dim_date ──────────┐
dim_customer ──────┤
                fact_sales
dim_product ───────┤
dim_order ─────────┘
```

`payment_value_allocated` distributes the order-level payment proportionally by item price. If an order has two items worth R$70 and R$30 and the total payment was R$95, the first item gets R$66.50 and the second R$28.50. The sum always equals the total payment. This is documented in `EXPLICATIONS.md` with the alternatives considered.

## KPIs

| KPI | Definition |
|-----|-----------|
| GMV | Sum of item prices — catalog value, not what the customer actually paid |
| Revenue | Sum of allocated payments — actual money collected |
| Orders | Count of distinct order IDs |
| AOV | Revenue ÷ Orders |
| Items per Order | Total items ÷ Orders |
| Cancellation Rate | (canceled + unavailable) ÷ total orders |
| On-Time Delivery | Delivered on or before estimated date ÷ total delivered |

`unavailable` orders are counted as canceled. From a business standpoint they're the same thing — the customer didn't receive the product. You can split them apart in one line of SQL if needed.

`is_on_time` is `NULL` for non-delivered orders. Not `false` — it simply doesn't apply.

## API endpoints

```
GET /health
GET /kpis?from=YYYY-MM-DD&to=YYYY-MM-DD[&order_status=...][&customer_state=...]
GET /trend/revenue?from=...&to=...&grain=day|week[&order_status=...][&customer_state=...]
GET /rankings/products?from=...&to=...&metric=gmv|revenue&limit=N
```

All date params are required. The business rules enforced by the API:
- KPI range: max 730 days
- Trend with `grain=day`: max 365 days (365 data points is already a lot for a chart)
- Trend with `grain=week`: max 730 days
- Rankings limit: 1–100

## Environment variables

| Variable | Service | Default |
|----------|---------|---------|
| `DATABASE_URL` | backend | required |
| `DATA_DIR` | backend | `./data` |
| `PORT` | backend | `3001` |
| `CORS_ORIGIN` | backend | `http://localhost:3000` |
| `NEXT_PUBLIC_API_URL` | frontend | `http://localhost:3001` |

The backend fails at startup if `DATABASE_URL` is missing. It doesn't fail silently mid-request.

## Security

- `helmet` sets standard security headers (CSP, HSTS, X-Frame-Options, etc.)
- Rate limiting: 120 requests/minute per IP
- CORS is restricted to `CORS_ORIGIN` — not `*`
- All query params go through Zod before reaching the database
- Prisma `$queryRaw` uses parameterized queries — no string interpolation in SQL
- Error responses never include stack traces

What's missing for a real production deployment:
- Authentication (this is an internal dashboard, add a session layer before exposing it)
- A read-only database user for the API (currently using the same Postgres user as the ETL)
- HTTPS via a reverse proxy (nginx or Traefik in front of Docker)
- Secrets management (not .env files)

For a deeper explanation of every technical decision and what breaks if you change something, see [EXPLICATIONS.md](./EXPLICATIONS.md).
