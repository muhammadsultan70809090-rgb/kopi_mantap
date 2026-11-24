export type SizeOption = {
  label: string;
  extra: number;
};

export type ImageRef = {
  name: string;
  image: string;
};

export type Product = {
  id: number;
  name: string;
  category: string;
  price: number;
  description: string;
  image: string;
  inStock: boolean;
  sizes: SizeOption[];
  temperatures: string[];
  ingredients: ImageRef[];
  tools: ImageRef[];
  steps: string[];
  featured: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type CartItem = {
  key: string;
  productId: number;
  name: string;
  image: string;
  sizeLabel: string;
  temperature: string;
  unitPrice: number;
  qty: number;
};

export type AdminUser = {
  id: number;
  username: string;
};

export type AdminStats = {
  total: number;
  inStock: number;
  outOfStock: number;
  value: number;
  byCategory: { category: string; n: number }[];
  orders?: { total: number; baru: number };
};

export type OrderStatus = 'baru' | 'diproses' | 'siap' | 'selesai' | 'dibatalkan';

export type OrderItem = {
  productId: number;
  name: string;
  sizeLabel: string;
  temperature: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
};

export type Order = {
  id: number;
  code: string;
  customerName: string;
  customerPhone: string;
  method: 'pickup' | 'delivery';
  address: string;
  note: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  createdAt?: string;
  updatedAt?: string;
};

export type OrderInput = {
  customerName: string;
  customerPhone: string;
  method: 'pickup' | 'delivery';
  address: string;
  note: string;
  items: { productId: number; sizeLabel: string; temperature: string; qty: number }[];
};

export const ORDER_STATUSES: OrderStatus[] = [
  'baru',
  'diproses',
  'siap',
  'selesai',
  'dibatalkan',
];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  baru: 'Baru',
  diproses: 'Diproses',
  siap: 'Siap diambil',
  selesai: 'Selesai',
  dibatalkan: 'Dibatalkan',
};

export const CATEGORIES = [
  'Coffee Milk',
  'Espresso Based',
  'Flavored Coffee',
  'Non-Coffee',
] as const;

export const WHATSAPP_NUMBER = '6282122190680';

export const formatRupiah = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
