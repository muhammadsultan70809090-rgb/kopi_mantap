import type { AdminStats, AdminUser, Product } from './types';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    credentials: 'same-origin',
    headers: options.body instanceof FormData ? undefined : { 'Content-Type': 'application/json' },
    ...options,
  });

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const payload = isJson ? await response.json() : null;

  if (!response.ok) {
    throw new Error(payload?.error || `Permintaan gagal (${response.status}).`);
  }
  return payload as T;
}

export const api = {
  products: () => request<{ products: Product[] }>('/api/products'),

  login: (username: string, password: string) =>
    request<{ admin: AdminUser }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  logout: () => request<{ ok: boolean }>('/api/auth/logout', { method: 'POST' }),

  me: () => request<{ admin: AdminUser }>('/api/auth/me'),

  adminProducts: () => request<{ products: Product[] }>('/api/admin/products'),

  stats: () => request<{ stats: AdminStats }>('/api/admin/stats'),

  createProduct: (data: unknown) =>
    request<{ product: Product }>('/api/admin/products', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateProduct: (id: number, data: unknown) =>
    request<{ product: Product }>(`/api/admin/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  toggleStock: (id: number, inStock: boolean) =>
    request<{ product: Product }>(`/api/admin/products/${id}/stock`, {
      method: 'PATCH',
      body: JSON.stringify({ inStock }),
    }),

  deleteProduct: (id: number) =>
    request<{ ok: boolean }>(`/api/admin/products/${id}`, { method: 'DELETE' }),

  upload: (file: File) => {
    const form = new FormData();
    form.append('image', file);
    return request<{ url: string }>('/api/admin/upload', { method: 'POST', body: form });
  },
};
