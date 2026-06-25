const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

function toQuery(params: Record<string, string | number | undefined>): string {
  const q = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join('&');
  return q ? `?${q}` : '';
}

export async function apiFetch(url: string): Promise<Response> {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Error ${res.status}`);
  }
  return res;
}

export const fetchKpis = (params: Record<string, string>) =>
  apiFetch(`${API_URL}/kpis${toQuery(params)}`);

export const fetchTrend = (params: Record<string, string>) =>
  apiFetch(`${API_URL}/trend/revenue${toQuery(params)}`);

export const fetchProducts = (params: Record<string, string | number>) =>
  apiFetch(`${API_URL}/rankings/products${toQuery(params)}`);
