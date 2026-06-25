-- Schema CLEAN: tipos correctos, null-handling, normalización y deduplicación
CREATE SCHEMA IF NOT EXISTS clean;

CREATE TABLE IF NOT EXISTS clean.orders (
  order_id                       VARCHAR PRIMARY KEY,
  customer_id                    VARCHAR NOT NULL,
  order_status                   VARCHAR,
  order_purchase_timestamp       TIMESTAMP,
  order_approved_at              TIMESTAMP,
  order_delivered_carrier_date   TIMESTAMP,
  order_delivered_customer_date  TIMESTAMP,
  order_estimated_delivery_date  TIMESTAMP
);

CREATE TABLE IF NOT EXISTS clean.order_items (
  order_id       VARCHAR,
  order_item_id  INT,
  product_id     VARCHAR,
  seller_id      VARCHAR,
  price          NUMERIC(10, 2),
  freight_value  NUMERIC(10, 2),
  PRIMARY KEY (order_id, order_item_id)
);

-- Pagos agregados por orden (múltiples pagos se suman)
CREATE TABLE IF NOT EXISTS clean.order_payments (
  order_id             VARCHAR PRIMARY KEY,
  total_payment_value  NUMERIC(10, 2)
);

CREATE TABLE IF NOT EXISTS clean.products (
  product_id             VARCHAR PRIMARY KEY,
  product_category_name  VARCHAR
);

CREATE TABLE IF NOT EXISTS clean.customers (
  customer_id              VARCHAR PRIMARY KEY,
  customer_unique_id       VARCHAR,
  customer_zip_code_prefix VARCHAR,
  customer_city            VARCHAR,
  customer_state           VARCHAR
);

CREATE TABLE IF NOT EXISTS clean.product_category_name_translation (
  product_category_name         VARCHAR PRIMARY KEY,
  product_category_name_english VARCHAR
);
