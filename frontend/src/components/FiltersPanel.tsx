'use client';
import { Filters } from '../types';

const BR_STATES = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA',
  'MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN',
  'RS','RO','RR','SC','SP','SE','TO',
];

const ORDER_STATUSES = [
  'delivered','shipped','canceled','unavailable','invoiced','processing','created','approved',
];

interface FiltersPanelProps {
  filters: Filters;
  onChange: (f: Filters) => void;
}

const inputCls = 'border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 bg-slate-50 dark:bg-slate-700 dark:text-slate-200 w-full';

export function FiltersPanel({ filters, onChange }: FiltersPanelProps) {
  const set = (key: keyof Filters, val: string) => onChange({ ...filters, [key]: val });

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-5 flex flex-wrap gap-4 items-end">
      <div className="flex flex-col gap-1 min-w-[140px]">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest">From</label>
        <input type="date" value={filters.from} onChange={(e) => set('from', e.target.value)} className={inputCls} />
      </div>

      <div className="flex flex-col gap-1 min-w-[140px]">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest">To</label>
        <input type="date" value={filters.to} onChange={(e) => set('to', e.target.value)} className={inputCls} />
      </div>

      <div className="flex flex-col gap-1 min-w-[160px]">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Order Status</label>
        <select value={filters.orderStatus} onChange={(e) => set('orderStatus', e.target.value)} className={inputCls}>
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="flex flex-col gap-1 min-w-[140px]">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Customer State</label>
        <select value={filters.customerState} onChange={(e) => set('customerState', e.target.value)} className={inputCls}>
          <option value="">All states</option>
          {BR_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Trend Grain</label>
        <div className="flex gap-1 bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
          {(['day', 'week'] as const).map((g) => (
            <button
              key={g}
              onClick={() => set('grain', g)}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all duration-150 ${
                filters.grain === g
                  ? 'bg-white dark:bg-slate-500 text-violet-700 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
