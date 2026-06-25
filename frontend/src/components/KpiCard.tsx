'use client';

interface KpiCardProps {
  title: string;
  value: string;
  subtitle?: string;
  color?: string;
}

export function KpiCard({ title, value, subtitle, color = 'blue' }: KpiCardProps) {
  const colorMap: Record<string, string> = {
    blue: 'border-blue-500',
    green: 'border-green-500',
    red: 'border-red-500',
    yellow: 'border-yellow-500',
    purple: 'border-purple-500',
    teal: 'border-teal-500',
  };

  return (
    <div className={`bg-white rounded-xl shadow p-5 border-l-4 ${colorMap[color] ?? 'border-blue-500'}`}>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{title}</p>
      <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </div>
  );
}
