import { Client } from 'pg';
import { from as copyFrom } from 'pg-copy-streams';
import * as fs from 'fs';
import * as path from 'path';
import { pipeline } from 'stream/promises';

const DATA_DIR = process.env.DATA_DIR ?? path.join(__dirname, '../../../../data');
const DATABASE_URL = process.env.DATABASE_URL ?? '';

const SQL_DIR = path.join(__dirname, 'sql');

const CSV_TABLES: Array<{ file: string; table: string }> = [
  { file: 'olist_orders_dataset.csv',                   table: 'raw.orders' },
  { file: 'olist_order_items_dataset.csv',              table: 'raw.order_items' },
  { file: 'olist_order_payments_dataset.csv',           table: 'raw.order_payments' },
  { file: 'olist_products_dataset.csv',                 table: 'raw.products' },
  { file: 'olist_customers_dataset.csv',                table: 'raw.customers' },
  { file: 'product_category_name_translation.csv',      table: 'raw.product_category_name_translation' },
  { file: 'olist_sellers_dataset.csv',                  table: 'raw.sellers' },
];

async function runSqlFile(client: Client, filename: string): Promise<void> {
  const sql = fs.readFileSync(path.join(SQL_DIR, filename), 'utf-8');
  console.log(`  [SQL] Running ${filename}...`);
  await client.query(sql);
  console.log(`  [SQL] Done ${filename}`);
}

async function loadCsv(client: Client, table: string, filePath: string): Promise<void> {
  const stream = client.query(
    copyFrom(`COPY ${table} FROM STDIN WITH (FORMAT CSV, HEADER true, DELIMITER ',')`),
  );
  const fileStream = fs.createReadStream(filePath);
  await pipeline(fileStream, stream);
}

async function main() {
  console.log('=== ETL START ===');
  console.log(`DATA_DIR: ${DATA_DIR}`);

  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();

  try {
    // 1. Create schemas and tables
    console.log('\n--- Step 1: Creating schemas and tables ---');
    await runSqlFile(client, '001_raw.sql');
    await runSqlFile(client, '002_clean.sql');
    await runSqlFile(client, '003_gold.sql');

    // 2. Load CSVs into raw (truncate first for idempotency)
    console.log('\n--- Step 2: Loading CSVs into raw ---');
    const tablesToTruncate = CSV_TABLES.map((t) => t.table).join(', ');
    await client.query(`TRUNCATE ${tablesToTruncate}`);

    let anyLoaded = false;
    for (const { file, table } of CSV_TABLES) {
      const filePath = path.join(DATA_DIR, file);
      if (!fs.existsSync(filePath)) {
        console.warn(`  [WARN] ${file} not found — skipping`);
        continue;
      }
      console.log(`  [COPY] ${file} → ${table}`);
      await loadCsv(client, table, filePath);
      anyLoaded = true;
    }

    if (!anyLoaded) {
      console.error('\n[ERROR] No CSV files found in DATA_DIR. Cannot build gold layer.');
      console.error(`Place Olist CSV files in: ${DATA_DIR}`);
      process.exit(1);
    }

    // 3. raw → clean
    console.log('\n--- Step 3: raw → clean ---');
    await runSqlFile(client, '004_raw_to_clean.sql');

    // 4. clean → gold
    console.log('\n--- Step 4: clean → gold ---');
    await runSqlFile(client, '005_clean_to_gold.sql');

    // Summary
    const { rows } = await client.query('SELECT COUNT(*) FROM gold.fact_sales');
    console.log(`\n=== ETL COMPLETE: ${rows[0].count} rows in gold.fact_sales ===`);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('[ETL FATAL]', err);
  process.exit(1);
});
