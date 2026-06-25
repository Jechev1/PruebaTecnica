# Olist Sales Dashboard

Dashboard de performance de ventas construido sobre el dataset público de Olist — ~100k órdenes entre 2016 y 2018 en Brasil.

---

## Setup

### 1. Datos

Descarga el dataset de Olist y pon estos archivos en `./data/`:

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

Si falta algún archivo el ETL te dice cuál es. No carga datos parciales sin avisarte.

### 2. Variables de entorno

Crea un `.env` en la raíz del proyecto:

```bash
cp .env.example .env
```

Edita `.env` y pon tu password de Postgres:

```
POSTGRES_PASSWORD=tu_password
```

### 3. Levantar

```bash
docker compose up --build
```

Eso es todo. Docker levanta Postgres, espera a que esté healthy, corre el ETL (raw → clean → gold), y luego inicia el backend y el frontend.

| | URL |
|--|--|
| Dashboard | http://localhost:3000 |
| API | http://localhost:3001 |

El primer build tarda unos minutos por la carga de CSVs. Los siguientes arrancan rápido.

---

## Desarrollo local (sin Docker)

```bash
# Solo la base de datos
docker compose up db -d

# Backend
cd backend && npm install && npx prisma generate
DATABASE_URL=postgresql://postgres:tu_password@localhost:5432/olist DATA_DIR=../data npm run etl
npm run dev

# Frontend (otra terminal)
cd frontend && npm install
NEXT_PUBLIC_API_URL=http://localhost:3001 npm run dev
```

```bash
# Tests
cd backend && npm test
```

---

## Arquitectura

```
Browser → Next.js (3000) → Express API (3001) → PostgreSQL (5432)
```

El frontend nunca toca la base de datos directamente. Todo pasa por el API.

El backend usa arquitectura hexagonal — la lógica de negocio no sabe que existe Express ni Prisma, solo conoce interfaces. En la práctica esto significa que si mañana cambias la base de datos, tocas los repositorios y nada más.

```
HTTP request
  → Controller (validación Zod)
    → Use Case (reglas de negocio)
      → Puerto (interfaz)
        → PrismaRepository (SQL sobre gold)
```

## Capas de datos

Los datos pasan por tres schemas de Postgres antes de que el API los toque:

| Schema | Qué es |
|--------|--------|
| `raw` | Copia exacta de los CSVs, todo TEXT. |
| `clean` | Tipos correctos, nulls manejados, pagos agregados por orden, deduplicado. |
| `gold` | Esquema estrella. El único schema que el API puede consultar. |

El API **solo lee de gold** — no puede acceder a raw ni clean.

## Esquema estrella

Grano: 1 fila por ítem de orden (`order_id + order_item_id`).

```
dim_date ──────────┐
dim_customer ──────┤
                fact_sales
dim_product ───────┤
dim_order ─────────┘
```

`payment_value_allocated` distribuye el pago total de la orden proporcionalmente por precio de ítem. Si una orden tiene dos ítems de R$70 y R$30 y el pago fue R$95, el primero recibe R$66.50 y el segundo R$28.50. La lógica completa está en `EXPLICATIONS.md`.

## KPIs

| KPI | Definición |
|-----|-----------|
| GMV | Suma de `item_price` — valor de catálogo, no lo que pagó el cliente |
| Revenue | Suma de `payment_value_allocated` — plata realmente cobrada |
| Orders | `COUNT(DISTINCT order_id)` |
| AOV | Revenue ÷ Orders |
| Items per Order | Total ítems ÷ Orders |
| Cancellation Rate | (canceladas + unavailable) ÷ total. `unavailable` se trata igual que cancelada porque el cliente tampoco recibió el producto. |
| On-Time Delivery | Órdenes entregadas en fecha ÷ total entregadas. `is_on_time` es `NULL` para órdenes no entregadas, no `false`. |

## Endpoints

```
GET /health
GET /kpis?from=YYYY-MM-DD&to=YYYY-MM-DD[&order_status=...][&customer_state=...]
GET /trend/revenue?from=...&to=...&grain=day|week[&order_status=...][&customer_state=...]
GET /rankings/products?from=...&to=...&metric=gmv|revenue&limit=N
```

Límites que el backend enforcea:
- KPIs: máximo 730 días
- Trend diario: máximo 365 días
- Trend semanal: máximo 730 días
- Rankings limit: entre 1 y 100

## Variables de entorno

| Variable | Servicio | Default |
|----------|---------|---------|
| `POSTGRES_PASSWORD` | docker-compose | requerido (en `.env`) |
| `DATABASE_URL` | backend | requerido |
| `DATA_DIR` | backend | `./data` |
| `PORT` | backend | `3001` |
| `CORS_ORIGIN` | backend | `http://localhost:3000` |
| `NEXT_PUBLIC_API_URL` | frontend | `http://localhost:3001` |

El backend falla en startup si `DATABASE_URL` no está — no falla silenciosamente en el primer request.

## Seguridad

- `helmet` para headers estándar
- Rate limiting: 120 req/min por IP
- CORS restringido a `CORS_ORIGIN`, nunca `*`
- Validación de params con Zod antes de tocar la DB
- `$queryRaw` con queries parametrizadas — sin interpolación de strings en SQL
- Los errores nunca exponen stack traces

Lo que faltaría para producción real: autenticación, usuario de DB read-only para el API, HTTPS con reverse proxy, y gestión de secrets fuera de `.env`.

Para el detalle de cada decisión técnica ver [EXPLICATIONS.md](./EXPLICATIONS.md).
