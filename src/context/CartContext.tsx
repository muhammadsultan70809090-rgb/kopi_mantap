import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { CartItem, Product, SizeOption } from '../types';

type CartContextValue = {
  items: CartItem[];
  count: number;
  total: number;
  isOpen: boolean;
  setOpen: (open: boolean) => void;
  addItem: (product: Product, size: SizeOption, temperature: string, qty: number) => void;
  updateQty: (key: string, qty: number) => void;
  removeItem: (key: string) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = 'kopi-mantap-cart';

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadCart);
  const [isOpen, setOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* storage may be unavailable — cart still works for this session */
    }
  }, [items]);

  const addItem = useCallback(
    (product: Product, size: SizeOption, temperature: string, qty: number) => {
      const key = `${product.id}::${size.label}::${temperature || '-'}`;
      setItems((current) => {
        const existing = current.find((item) => item.key === key);
        if (existing) {
          return current.map((item) =>
            item.key === key ? { ...item, qty: Math.min(99, item.qty + qty) } : item,
          );
        }
        return [
          ...current,
          {
            key,
            productId: product.id,
            name: product.name,
            image: product.image,
            sizeLabel: size.label,
            temperature,
            unitPrice: product.price + size.extra,
            qty: Math.min(99, Math.max(1, qty)),
          },
        ];
      });
      setOpen(true);
    },
    [],
  );

  const updateQty = useCallback((key: string, qty: number) => {
    setItems((current) =>
      qty <= 0
        ? current.filter((item) => item.key !== key)
        : current.map((item) => (item.key === key ? { ...item, qty: Math.min(99, qty) } : item)),
    );
  }, []);

  const removeItem = useCallback((key: string) => {
    setItems((current) => current.filter((item) => item.key !== key));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((sum, item) => sum + item.qty, 0);
    const total = items.reduce((sum, item) => sum + item.unitPrice * item.qty, 0);
    return {
      items,
      count,
      total,
      isOpen,
      setOpen,
      addItem,
      updateQty,
      removeItem,
      clearCart,
    };
  }, [items, isOpen, addItem, updateQty, removeItem, clearCart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart harus dipakai di dalam CartProvider');
  return context;
}
