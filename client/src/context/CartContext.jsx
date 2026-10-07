import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const CartContext = createContext(null);
const KEY = 'ieds.cart';

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem(KEY) || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(items));
  }, [items]);

  const value = useMemo(() => ({
    items,
    count: items.reduce((sum, item) => sum + item.quantity, 0),
    add({ productId, quantity = 1, color = '', size = '' }) {
      const key = `${productId}|${color}|${size}`;
      setItems((current) => {
        const found = current.find((item) => `${item.productId}|${item.color || ''}|${item.size || ''}` === key);
        if (found) {
          return current.map((item) => (`${item.productId}|${item.color || ''}|${item.size || ''}` === key
            ? { ...item, quantity: Math.min(20, item.quantity + quantity) }
            : item));
        }
        return [...current, { productId, quantity, color, size }];
      });
    },
    update(key, quantity) {
      setItems((current) => current
        .map((item) => (`${item.productId}|${item.color || ''}|${item.size || ''}` === key ? { ...item, quantity } : item))
        .filter((item) => item.quantity > 0));
    },
    remove(key) {
      setItems((current) => current.filter((item) => `${item.productId}|${item.color || ''}|${item.size || ''}` !== key));
    },
    clear() {
      setItems([]);
    },
  }), [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
}
