-- Transform RAW → CLEAN
-- Conversión de tipos, null-handling, deduplicación

TRUNCATE clean.orders, clean.order_items, clean.order_payments,
         clean.products, clean.customers, clean.product_category_name_translation CASCADE;

-- clean.orders
INSERT INTO clean.orders
SELECT
  NULLIF(TRIM(order_id), '')                                                        AS order_id,
  NULLIF(TRIM(customer_id), '')                                                     AS customer_id,
  NULLIF(TRIM(order_status), '')                                                    AS order_status,
  CASE WHEN NULLIF(TRIM(order_purchase_timestamp), '') IS NULL THEN NULL
       ELSE TRIM(order_purchase_timestamp)::TIMESTAMP END,
  CASE WHEN NULLIF(TRIM(order_approved_at), '') IS NULL THEN NULL
       ELSE TRIM(order_approved_at)::TIMESTAMP END,
  CASE WHEN NULLIF(TRIM(order_delivered_carrier_date), '') IS NULL THEN NULL
       ELSE TRIM(order_delivered_carrier_date)::TIMESTAMP END,
  CASE WHEN NULLIF(TRIM(order_delivered_customer_date), '') IS NULL THEN NULL
       ELSE TRIM(order_delivered_customer_date)::TIMESTAMP END,
  CASE WHEN NULLIF(TRIM(order_estimated_delivery_date), '') IS NULL THEN NULL
       ELSE TRIM(order_estimated_delivery_date)::TIMESTAMP END
FROM raw.orders
WHERE NULLIF(TRIM(order_id), '') IS NOT NULL
  AND NULLIF(TRIM(customer_id), '') IS NOT NULL
ON CONFLICT (order_id) DO NOTHING;

-- clean.order_items (solo registros con precio numérico válido)
INSERT INTO clean.order_items
SELECT
  TRIM(order_id)        AS order_id,
  order_item_id::INT,
  NULLIF(TRIM(product_id), ''),
  NULLIF(TRIM(seller_id), ''),
  CASE WHEN price ~ '^\d+(\.\d+)?$' THEN price::NUMERIC ELSE 0 END,
  CASE WHEN freight_value ~ '^\d+(\.\d+)?$' THEN freight_value::NUMERIC ELSE 0 END
FROM raw.order_items
WHERE NULLIF(TRIM(order_id), '') IS NOT NULL
  AND order_item_id ~ '^\d+$'
ON CONFLICT (order_id, order_item_id) DO NOTHING;

-- clean.order_payments (agrega múltiples pagos por orden)
INSERT INTO clean.order_payments
SELECT
  order_id,
  SUM(CASE WHEN payment_value ~ '^\d+(\.\d+)?$' THEN payment_value::NUMERIC ELSE 0 END)
FROM raw.order_payments
WHERE NULLIF(TRIM(order_id), '') IS NOT NULL
GROUP BY order_id
ON CONFLICT (order_id) DO UPDATE
  SET total_payment_value = EXCLUDED.total_payment_value;

-- clean.products
INSERT INTO clean.products
SELECT DISTINCT ON (product_id)
  NULLIF(TRIM(product_id), ''),
  NULLIF(TRIM(product_category_name), '')
FROM raw.products
WHERE NULLIF(TRIM(product_id), '') IS NOT NULL
ON CONFLICT (product_id) DO NOTHING;

-- clean.customers (deduplicación: queda el último registro por customer_id)
INSERT INTO clean.customers
SELECT DISTINCT ON (customer_id)
  NULLIF(TRIM(customer_id), ''),
  NULLIF(TRIM(customer_unique_id), ''),
  NULLIF(TRIM(customer_zip_code_prefix), ''),
  NULLIF(TRIM(customer_city), ''),
  NULLIF(TRIM(customer_state), '')
FROM raw.customers
WHERE NULLIF(TRIM(customer_id), '') IS NOT NULL
ON CONFLICT (customer_id) DO NOTHING;

-- clean.product_category_name_translation
INSERT INTO clean.product_category_name_translation
SELECT DISTINCT ON (product_category_name)
  NULLIF(TRIM(product_category_name), ''),
  NULLIF(TRIM(product_category_name_english), '')
FROM raw.product_category_name_translation
WHERE NULLIF(TRIM(product_category_name), '') IS NOT NULL
ON CONFLICT (product_category_name) DO NOTHING;
