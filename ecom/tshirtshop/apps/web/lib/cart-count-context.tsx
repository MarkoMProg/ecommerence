"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { fetchCartClient } from "./api/cart";

interface CartCountContextType {
  /** Total quantity of all items across all cart lines. */
  count: number;
  /** Directly set the count (use when you already have the updated Cart). */
  setCount: (n: number) => void;
  /** Re-fetch the cart from the API and update the count. */
  refresh: () => Promise<void>;
}

const CartCountContext = createContext<CartCountContextType>({
  count: 0,
  setCount: () => {},
  refresh: async () => {},
});

export function CartCountProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const cart = await fetchCartClient();
      setCount(cart?.itemCount ?? 0);
    } catch {
      // Silently ignore — badge stays at whatever it was
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <CartCountContext.Provider value={{ count, setCount, refresh }}>
      {children}
    </CartCountContext.Provider>
  );
}

export function useCartCount(): CartCountContextType {
  return useContext(CartCountContext);
}
