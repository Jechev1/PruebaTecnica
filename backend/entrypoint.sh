#!/bin/sh
set -e

echo ">>> Running ETL (schema creation + data load + transforms)..."
node dist/infrastructure/etl/etl.js

echo ">>> Starting API server..."
exec node dist/index.js
