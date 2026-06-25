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

export function FiltersPanel({ filters, onChange }: FiltersPanelProps) {
  const set = (key: keyof Filters, val: string) => onChange({ ...filters, [key]: val });

  return (
    <div className="bg-white rounded-xl shadow p-5 flex flex-wrap gap-4 items-end">
      <div className="flex flex-col gap-1 min-w-[140px]">
        <label className="text-xs font-semibold text-gray-500 uppercase">From</label>
        <input
          type="date"
          value={filters.from}
          onChange={(e) => set('from', e.target.value)}
          className="border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
      </div>

      <div className="flex flex-col gap-1 min-w-[140px]">
        <label className="text-xs font-semibold text-gray-500 uppercase">To</label>
        <input
          type="date"
          value={filters.to}
          onChange={(e) => set('to', e.target.value)}
          className="border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
      </div>

      {/* Filter 1: Order Status */}
      <div className="flex flex-col gap-1 min-w-[160px]">
        <label className="text-xs font-semibold text-gray-500 uppercase">Order Status</label>
        <select
          value={filters.orderStatus}
          onChange={(e) => set('orderStatus', e.target.value)}
          className="border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
        >
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Filter 2: Customer State */}
      <div className="flex flex-col gap-1 min-w-[140px]">
        <label className="text-xs font-semibold text-gray-500 uppercase">Customer State</label>
        <select
          value={filters.customerState}
          onChange={(e) => set('customerState', e.target.value)}
          className="border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
        >
          <option value="">All states</option>
          {BR_STATES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Grain toggle for trend */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-gray-500 uppercase">Trend Grain</label>
        <div className="flex gap-1">
          {(['day', 'week'] as const).map((g) => (
            <button
              key={g}
              onClick={() => set('grain', g)}
              className={`px-3 py-1.5 rounded text-sm font-medium transition ${
                filters.grain === g
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
