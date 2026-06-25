-- Schema GOLD: esquema estrella para analítica
CREATE SCHEMA IF NOT EXISTS gold;

CREATE TABLE IF NOT EXISTS gold.dim_date (
  date_id      INT PRIMARY KEY,
  full_date    DATE NOT NULL,
  year         INT,
  quarter      INT,
  month        INT,
  week         INT,
  day_of_week  INT,
  day_of_month INT,
  is_weekend   BOOLEAN
);

CREATE TABLE IF NOT EXISTS gold.dim_customer (
  customer_id        VARCHAR PRIMARY KEY,
  customer_unique_id VARCHAR,
  customer_state     VARCHAR,
  customer_city      VARCHAR
);

CREATE TABLE IF NOT EXISTS gold.dim_product (
  product_id            VARCHAR PRIMARY KEY,
  category_name         VARCHAR,
  category_name_english VARCHAR
);

CREATE TABLE IF NOT EXISTS gold.dim_order (
  order_id                VARCHAR PRIMARY KEY,
  order_status            VARCHAR,
  purchase_date           DATE,
  approved_at             TIMESTAMP,
  delivered_carrier_date  TIMESTAMP,
  delivered_customer_date TIMESTAMP,
  estimated_delivery_date TIMESTAMP
);

-- Tabla de hechos: grano = 1 fila por ítem de orden.
-- payment_value_allocated se distribuye proporcionalmente por item_price dentro de la orden.
-- is_canceled incluye 'unavailable' (ver EXPLICATIONS.md para la decisión).
CREATE TABLE IF NOT EXISTS gold.fact_sales (
  fact_id                 SERIAL PRIMARY KEY,
  order_id                VARCHAR NOT NULL,
  order_item_id           INT     NOT NULL,
  date_id                 INT,
  customer_id             VARCHAR,
  product_id              VARCHAR,
  seller_id               VARCHAR,
  item_price              NUMERIC(10, 2) DEFAULT 0,
  freight_value           NUMERIC(10, 2) DEFAULT 0,
  payment_value_allocated NUMERIC(10, 2) DEFAULT 0,
  is_delivered            BOOLEAN DEFAULT FALSE,
  is_canceled             BOOLEAN DEFAULT FALSE,
  is_on_time              BOOLEAN,
  UNIQUE (order_id, order_item_id)
);

-- Indexes: cubriendo los patrones de JOIN y filtrado del API.
-- date_id es el más importante — todas las queries filtran por rango de fechas.
CREATE INDEX IF NOT EXISTS idx_fact_date       ON gold.fact_sales (date_id);
CREATE INDEX IF NOT EXISTS idx_fact_product    ON gold.fact_sales (product_id);
CREATE INDEX IF NOT EXISTS idx_fact_customer   ON gold.fact_sales (customer_id);
CREATE INDEX IF NOT EXISTS idx_fact_order      ON gold.fact_sales (order_id);
CREATE INDEX IF NOT EXISTS idx_dim_date_full   ON gold.dim_date (full_date);
CREATE INDEX IF NOT EXISTS idx_dim_order_status ON gold.dim_order (order_status);
CREATE INDEX IF NOT EXISTS idx_dim_customer_state ON gold.dim_customer (customer_state);
CREATE INDEX IF NOT EXISTS idx_dim_product_cat ON gold.dim_product (category_name_english);
