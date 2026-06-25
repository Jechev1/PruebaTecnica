'use client';
import { useState, useEffect } from 'react';
import { KpiResult, Filters } from '../types';
import { fetchKpis } from '../lib/api';

export function useKpis(filters: Filters) {
  const [data, setData] = useState<KpiResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!filters.from || !filters.to) return;
    setLoading(true);
    setError(null);

    const params: Record<string, string> = { from: filters.from, to: filters.to };
    if (filters.orderStatus) params.order_status = filters.orderStatus;
    if (filters.customerState) params.customer_state = filters.customerState;

    fetchKpis(params)
      .then((res) => {
        if (!res.ok) throw new Error(`API error ${res.status}`);
        return res.json();
      })
      .then((json: KpiResult) => setData(json))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [filters.from, filters.to, filters.orderStatus, filters.customerState]);

  return { data, loading, error };
}
