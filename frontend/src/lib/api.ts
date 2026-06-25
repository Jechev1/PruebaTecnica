const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

function toQuery(params: Record<string, string | number | undefined>): string {
  const q = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join('&');
  return q ? `?${q}` : '';
}

export async function fetchKpis(params: Record<string, string>): Promise<Response> {
  return fetch(`${API_URL}/kpis${toQuery(params)}`);
}

export async function fetchTrend(params: Record<string, string>): Promise<Response> {
  return fetch(`${API_URL}/trend/revenue${toQuery(params)}`);
}

export async function fetchProducts(
  params: Record<string, string | number>,
): Promise<Response> {
  return fetch(`${API_URL}/rankings/products${toQuery(params)}`);
}
