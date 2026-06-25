'use client';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { TrendPoint } from '../types';

interface TrendChartProps {
  data: TrendPoint[];
  loading: boolean;
}

function fmt(n: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(n);
}

export function TrendChart({ data, loading }: TrendChartProps) {
  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading chart...</div>;
  if (!data.length) return <div className="flex items-center justify-center h-64 text-gray-400">No data</div>;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 8, right: 24, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="period" tick={{ fontSize: 11 }} />
        <YAxis yAxisId="left" tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
        <Tooltip
          formatter={(value: number, name: string) =>
            name === 'revenue' ? fmt(value) : value.toLocaleString()
          }
        />
        <Legend />
        <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#3b82f6" dot={false} name="Revenue" strokeWidth={2} />
        <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#10b981" dot={false} name="Orders" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
}
