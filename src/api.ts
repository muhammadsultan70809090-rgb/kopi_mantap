import type { AdminStats, AdminUser, Order, OrderInput, OrderStatus, Product } from './types';

/** Error API dengan status & kode supaya UI bisa membedakan masalah jaringan/konfigurasi. */
export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status = 0, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      credentials: 'same-origin',
      headers: options.body instanceof FormData ? undefined : { 'Content-Type': 'application/json' },
      ...options,
    });
  } catch {
    throw new ApiError('Tidak dapat menghubungi server. Periksa koneksi lalu coba lagi.', 0);
  }

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');

  // Kalau yang kembali HTML (mis. SPA fallback), jangan pernah mengembalikan null:
  // beri pesan yang jelas supaya UI tidak crash saat destructuring.
  if (!isJson) {
    throw new ApiError(
      response.ok
        ? 'Server mengirim halaman HTML, bukan data JSON. Route /api belum mengarah ke backend di hosting ini.'
        : `Permintaan gagal (${response.status}). Server tidak mengirim data JSON.`,
      response.status,
    );
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(
      payload?.error || `Permintaan gagal (${response.status}).`,
      response.status,
      payload?.code,
    );
  }

  if (payload === null || typeof payload !== 'object') {
    throw new ApiError('Respons server kosong atau tidak valid.', response.status);
  }

  return payload as T;
}

export const api = {
  products: async () => {
    const data = await request<{ products?: Product[] }>('/api/products');
    return { products: Array.isArray(data.products) ? data.products : [] };
  },

  login: (username: string, password: string) =>
    request<{ admin: AdminUser }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  logout: () => request<{ ok: boolean }>('/api/auth/logout', { method: 'POST' }),

  me: () => request<{ admin: AdminUser }>('/api/auth/me'),

  adminProducts: async () => {
    const data = await request<{ products?: Product[] }>('/api/admin/products');
    return { products: Array.isArray(data.products) ? data.products : [] };
  },

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

  createOrder: (input: OrderInput) =>
    request<{ order: Order }>('/api/orders', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  adminOrders: async () => {
    const data = await request<{ orders?: Order[] }>('/api/admin/orders');
    return { orders: Array.isArray(data.orders) ? data.orders : [] };
  },

  updateOrderStatus: (id: number, status: OrderStatus) =>
    request<{ order: Order }>(`/api/admin/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
};
