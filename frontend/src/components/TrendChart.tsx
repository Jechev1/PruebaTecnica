'use client';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { TrendPoint } from '../types';
import { useTheme } from './ThemeProvider';

interface TrendChartProps {
  data: TrendPoint[];
  loading: boolean;
  currency: 'BRL' | 'USD';
  conversionRate: number;
}

function fmtRevenue(n: number, currency: 'BRL' | 'USD', rate: number) {
  if (currency === 'USD') {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n / rate);
  }
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(n);
}

function CustomTooltip({ active, payload, label, currency, rate }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 text-white text-xs rounded-xl px-4 py-3 shadow-xl space-y-1">
      <p className="text-slate-400 mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color }} />
          <span className="text-slate-300">{p.name}:</span>
          <span className="font-semibold">
            {p.dataKey === 'revenue' ? fmtRevenue(p.value, currency, rate) : p.value.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}

export function TrendChart({ data, loading, currency, conversionRate }: TrendChartProps) {
  const { isDark } = useTheme();

  const axisColor = isDark ? '#64748b' : '#94a3b8';
  const gridColor = isDark ? '#1e293b' : '#f1f5f9';
  const tickStyle = { fontSize: 11, fill: axisColor };
  const yTickFmt = (v: number) => {
    const val = currency === 'USD' ? v / conversionRate : v;
    const symbol = currency === 'USD' ? '$' : 'R$';
    return `${symbol}${(val / 1000).toFixed(0)}k`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    );
  }
  if (!data.length) {
    return <div className="flex items-center justify-center h-64 text-slate-400 text-sm">No data for selected range</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 8, right: 24, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradOrders" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
        <XAxis dataKey="period" tick={tickStyle} axisLine={false} tickLine={false} />
        <YAxis yAxisId="left" tickFormatter={yTickFmt} tick={tickStyle} axisLine={false} tickLine={false} />
        <YAxis yAxisId="right" orientation="right" tick={tickStyle} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip currency={currency} rate={conversionRate} />} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: axisColor }} />
        <Area yAxisId="left" type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={2} fill="url(#gradRevenue)" dot={false} name="Revenue" />
        <Area yAxisId="right" type="monotone" dataKey="orders" stroke="#10b981" strokeWidth={2} fill="url(#gradOrders)" dot={false} name="Orders" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
