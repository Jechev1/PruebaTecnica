'use client';
import { TopProduct, ProductMetric } from '../types';

interface ProductsTableProps {
  data: TopProduct[];
  loading: boolean;
  metric: ProductMetric;
  onMetricChange: (m: ProductMetric) => void;
  currency: 'BRL' | 'USD';
  conversionRate: number;
}

function fmtMoney(n: number, currency: 'BRL' | 'USD', rate: number) {
  if (currency === 'USD') {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n / rate);
  }
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(n);
}

export function ProductsTable({ data, loading, metric, onMetricChange, currency, conversionRate }: ProductsTableProps) {
  const maxVal = data.length ? Math.max(...data.map((p) => (metric === 'gmv' ? p.gmv : p.revenue))) : 1;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
        <div>
          <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest">Top Products</h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Ranked by selected metric</p>
        </div>
        <div className="flex gap-1 bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
          {(['gmv', 'revenue'] as ProductMetric[]).map((m) => (
            <button
              key={m}
              onClick={() => onMetricChange(m)}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all duration-150 ${
                metric === m
                  ? 'bg-white dark:bg-slate-500 text-violet-700 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              {m.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3 p-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-8 bg-slate-100 dark:bg-slate-700 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : data.length === 0 ? (
        <p className="text-center text-slate-400 py-12 text-sm">No data for selected range</p>
      ) : (
        <div className="divide-y divide-slate-50 dark:divide-slate-700/50">
          {data.map((p, i) => {
            const val = metric === 'gmv' ? p.gmv : p.revenue;
            const pct = Math.round((val / maxVal) * 100);
            return (
              <div key={p.productId} className="flex items-center gap-4 px-6 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors">
                <span className="text-xs font-bold text-slate-300 dark:text-slate-600 w-5 shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="min-w-0">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate block">
                        {p.categoryNameEnglish ?? p.categoryName ?? '—'}
                      </span>
                      <span className="text-xs font-mono text-slate-400 dark:text-slate-500">
                        {p.productId.slice(0, 8)}…
                      </span>
                    </div>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200 ml-4 shrink-0">
                      {fmtMoney(val, currency, conversionRate)}
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-violet-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
