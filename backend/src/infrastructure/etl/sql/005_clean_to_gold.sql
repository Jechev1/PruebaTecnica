-- Transform CLEAN → GOLD (esquema estrella)

TRUNCATE gold.fact_sales, gold.dim_order, gold.dim_product,
         gold.dim_customer, gold.dim_date CASCADE;

-- gold.dim_date: calendario continuo entre la primera y última compra
INSERT INTO gold.dim_date
SELECT
  TO_CHAR(d, 'YYYYMMDD')::INT       AS date_id,
  d::DATE                           AS full_date,
  EXTRACT(YEAR    FROM d)::INT      AS year,
  EXTRACT(QUARTER FROM d)::INT      AS quarter,
  EXTRACT(MONTH   FROM d)::INT      AS month,
  EXTRACT(WEEK    FROM d)::INT      AS week,
  EXTRACT(DOW     FROM d)::INT      AS day_of_week,
  EXTRACT(DAY     FROM d)::INT      AS day_of_month,
  EXTRACT(DOW     FROM d) IN (0, 6) AS is_weekend
FROM generate_series(
  (SELECT MIN(order_purchase_timestamp)::DATE FROM clean.orders WHERE order_purchase_timestamp IS NOT NULL),
  (SELECT MAX(order_purchase_timestamp)::DATE FROM clean.orders WHERE order_purchase_timestamp IS NOT NULL),
  '1 day'::INTERVAL
) AS t(d)
ON CONFLICT (date_id) DO NOTHING;

-- gold.dim_customer
INSERT INTO gold.dim_customer (customer_id, customer_unique_id, customer_state, customer_city)
SELECT
  customer_id,
  customer_unique_id,
  customer_state,
  customer_city
FROM clean.customers
WHERE customer_id IS NOT NULL
ON CONFLICT (customer_id) DO NOTHING;

-- gold.dim_product (incluye nombre de categoría en inglés)
INSERT INTO gold.dim_product (product_id, category_name, category_name_english)
SELECT DISTINCT ON (p.product_id)
  p.product_id,
  p.product_category_name                                                                AS category_name,
  COALESCE(t.product_category_name_english, p.product_category_name)                   AS category_name_english
FROM clean.products p
LEFT JOIN clean.product_category_name_translation t
  ON p.product_category_name = t.product_category_name
WHERE p.product_id IS NOT NULL
ON CONFLICT (product_id) DO NOTHING;

-- gold.dim_order
INSERT INTO gold.dim_order
SELECT
  order_id,
  order_status,
  order_purchase_timestamp::DATE  AS purchase_date,
  order_approved_at,
  order_delivered_carrier_date,
  order_delivered_customer_date,
  order_estimated_delivery_date
FROM clean.orders
WHERE order_id IS NOT NULL
ON CONFLICT (order_id) DO NOTHING;

-- gold.fact_sales (grano: 1 fila por ítem de orden)
-- payment_value_allocated = total_pago_orden * (item_price / suma_prices_en_orden)
-- is_canceled incluye 'canceled' y 'unavailable' (ver README para decisión)
INSERT INTO gold.fact_sales (
  order_id, order_item_id, date_id, customer_id, product_id, seller_id,
  item_price, freight_value, payment_value_allocated,
  is_delivered, is_canceled, is_on_time
)
SELECT
  oi.order_id,
  oi.order_item_id,
  COALESCE(TO_CHAR(o.order_purchase_timestamp, 'YYYYMMDD')::INT, 0) AS date_id,
  o.customer_id,
  oi.product_id,
  oi.seller_id,
  COALESCE(oi.price, 0)                                              AS item_price,
  COALESCE(oi.freight_value, 0)                                      AS freight_value,
  CASE
    WHEN totals.total_price > 0
    THEN ROUND(
           COALESCE(p.total_payment_value, 0) * (COALESCE(oi.price, 0) / totals.total_price),
           2
         )
    ELSE 0
  END                                                                AS payment_value_allocated,
  o.order_status = 'delivered'                                       AS is_delivered,
  o.order_status IN ('canceled', 'unavailable')                      AS is_canceled,
  CASE
    WHEN o.order_status = 'delivered'
      AND o.order_delivered_customer_date IS NOT NULL
      AND o.order_estimated_delivery_date IS NOT NULL
    THEN o.order_delivered_customer_date <= o.order_estimated_delivery_date
    ELSE NULL
  END                                                                AS is_on_time
FROM clean.order_items oi
JOIN clean.orders o ON oi.order_id = o.order_id
LEFT JOIN clean.order_payments p ON oi.order_id = p.order_id
JOIN (
  SELECT order_id, SUM(COALESCE(price, 0)) AS total_price
  FROM clean.order_items
  GROUP BY order_id
) totals ON oi.order_id = totals.order_id
ON CONFLICT (order_id, order_item_id) DO NOTHING;
