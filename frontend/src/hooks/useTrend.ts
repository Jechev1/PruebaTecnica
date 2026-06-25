'use client';
import { useState, useEffect } from 'react';
import { TrendPoint, Filters } from '../types';
import { fetchTrend } from '../lib/api';

export function useTrend(filters: Filters) {
  const [data, setData] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!filters.from || !filters.to) return;
    setLoading(true);
    setError(null);

    const params: Record<string, string> = {
      from: filters.from,
      to: filters.to,
      grain: filters.grain,
    };
    if (filters.orderStatus) params.order_status = filters.orderStatus;
    if (filters.customerState) params.customer_state = filters.customerState;

    fetchTrend(params)
      .then((res) => res.json())
      .then((json: TrendPoint[]) => setData(json))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [filters.from, filters.to, filters.grain, filters.orderStatus, filters.customerState]);

  return { data, loading, error };
}
