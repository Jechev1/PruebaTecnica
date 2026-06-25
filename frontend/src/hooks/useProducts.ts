'use client';
import { useState, useEffect } from 'react';
import { TopProduct, Filters, ProductMetric } from '../types';
import { fetchProducts } from '../lib/api';

export function useProducts(filters: Filters, metric: ProductMetric, limit: number) {
  const [data, setData] = useState<TopProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!filters.from || !filters.to) return;
    setLoading(true);
    setError(null);

    const params: Record<string, string | number> = {
      from: filters.from,
      to: filters.to,
      metric,
      limit,
    };
    if (filters.orderStatus) params.order_status = filters.orderStatus;
    if (filters.customerState) params.customer_state = filters.customerState;

    fetchProducts(params)
      .then((res) => res.json())
      .then((json: TopProduct[]) => setData(json))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [filters.from, filters.to, filters.orderStatus, filters.customerState, metric, limit]);

  return { data, loading, error };
}
