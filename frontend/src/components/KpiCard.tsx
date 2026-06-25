'use client';

interface KpiCardProps {
  title: string;
  value: string;
  subtitle?: string;
  color?: string;
}

const palette: Record<string, { bar: string; text: string }> = {
  blue:   { bar: 'bg-blue-500',    text: 'text-blue-600 dark:text-blue-400' },
  green:  { bar: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400' },
  red:    { bar: 'bg-rose-500',    text: 'text-rose-600 dark:text-rose-400' },
  yellow: { bar: 'bg-amber-400',   text: 'text-amber-600 dark:text-amber-400' },
  purple: { bar: 'bg-violet-500',  text: 'text-violet-600 dark:text-violet-400' },
  teal:   { bar: 'bg-teal-500',    text: 'text-teal-600 dark:text-teal-400' },
};

export function KpiCard({ title, value, subtitle, color = 'blue' }: KpiCardProps) {
  const c = palette[color] ?? palette.blue;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden hover:shadow-md transition-shadow duration-200">
      <div className={`h-1 w-full ${c.bar}`} />
      <div className="p-5">
        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{title}</p>
        <p className={`text-2xl font-bold mt-2 leading-none ${c.text}`}>{value}</p>
        {subtitle && (
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 leading-snug">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
