'use client';
import { TopProduct, ProductMetric } from '../types';

interface ProductsTableProps {
  data: TopProduct[];
  loading: boolean;
  metric: ProductMetric;
  onMetricChange: (m: ProductMetric) => void;
}

function fmtBRL(n: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
}

export function ProductsTable({ data, loading, metric, onMetricChange }: ProductsTableProps) {
  return (
    <div className="bg-white rounded-xl shadow p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-700">Top Products</h2>
        <div className="flex gap-2">
          {(['gmv', 'revenue'] as ProductMetric[]).map((m) => (
            <button
              key={m}
              onClick={() => onMetricChange(m)}
              className={`px-3 py-1 rounded text-sm font-medium transition ${
                metric === m
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {m.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-center text-gray-400 py-8">Loading...</p>
      ) : data.length === 0 ? (
        <p className="text-center text-gray-400 py-8">No data</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-2 pr-4">#</th>
                <th className="pb-2 pr-4">Product ID</th>
                <th className="pb-2 pr-4">Category</th>
                <th className="pb-2 pr-4 text-right">GMV</th>
                <th className="pb-2 text-right">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {data.map((p, i) => (
                <tr key={p.productId} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="py-2 pr-4 text-gray-400">{i + 1}</td>
                  <td className="py-2 pr-4 font-mono text-xs">{p.productId.slice(0, 12)}…</td>
                  <td className="py-2 pr-4">{p.categoryNameEnglish ?? p.categoryName ?? '—'}</td>
                  <td className="py-2 pr-4 text-right">{fmtBRL(p.gmv)}</td>
                  <td className="py-2 text-right font-semibold">{fmtBRL(p.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
