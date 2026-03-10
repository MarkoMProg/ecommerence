"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { fetchCartClient, type Cart } from "./api/cart";

interface CartCountContextType {
  /** Total quantity of all items across all cart lines. */
  count: number;
  /** Directly set the count (use when you already have the updated Cart). */
  setCount: (n: number) => void;
  /** Re-fetch the cart from the API and update the count. */
  refresh: () => Promise<void>;
}

interface CartContextType extends CartCountContextType {
  /** Full cart data from the API. Null during initial fetch. */
  cart: Cart | null;
  /** Update cart data and sync the item count badge. */
  setCart: (cart: Cart | null) => void;
  /** Whether the mini cart drawer is open. */
  isDrawerOpen: boolean;
  /** Open the mini cart drawer. */
  openDrawer: () => void;
  /** Close the mini cart drawer. */
  closeDrawer: () => void;
  /** Increments each time an item is added — key the badge element on this to trigger pop animation. */
  badgePop: number;
  /** Trigger the badge pop animation. */
  triggerBadgePop: () => void;
  /** Product ID of the last item added, used to highlight it in the drawer. */
  lastAddedProductId: string | null;
  /** Set the last added product ID (set null to clear highlight). */
  setLastAddedProductId: (id: string | null) => void;
}

const CartContext = createContext<CartContextType>({
  count: 0,
  setCount: () => {},
  refresh: async () => {},
  cart: null,
  setCart: () => {},
  isDrawerOpen: false,
  openDrawer: () => {},
  closeDrawer: () => {},
  badgePop: 0,
  triggerBadgePop: () => {},
  lastAddedProductId: null,
  setLastAddedProductId: () => {},
});

export function CartCountProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [cart, setCartRaw] = useState<Cart | null>(null);
  const [count, setCountRaw] = useState(0);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [badgePop, setBadgePop] = useState(0);
  const [lastAddedProductId, setLastAddedProductId] = useState<string | null>(
    null,
  );

  const setCart = useCallback((c: Cart | null) => {
    setCartRaw(c);
    setCountRaw(c?.itemCount ?? 0);
  }, []);

  const setCount = useCallback((n: number) => {
    setCountRaw(n);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const fetched = await fetchCartClient();
      setCartRaw(fetched);
      setCountRaw(fetched?.itemCount ?? 0);
    } catch {
      // Silently ignore — badge stays at whatever it was
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const openDrawer = useCallback(() => setIsDrawerOpen(true), []);
  const closeDrawer = useCallback(() => {
    setIsDrawerOpen(false);
    setLastAddedProductId(null);
  }, []);

  const triggerBadgePop = useCallback(() => {
    setBadgePop((n) => n + 1);
  }, []);

  const value = useMemo<CartContextType>(
    () => ({
      count,
      setCount,
      refresh,
      cart,
      setCart,
      isDrawerOpen,
      openDrawer,
      closeDrawer,
      badgePop,
      triggerBadgePop,
      lastAddedProductId,
      setLastAddedProductId,
    }),
    [
      count,
      setCount,
      refresh,
      cart,
      setCart,
      isDrawerOpen,
      openDrawer,
      closeDrawer,
      badgePop,
      triggerBadgePop,
      lastAddedProductId,
    ],
  );

  return (
    <CartContext.Provider value={value}>{children}</CartContext.Provider>
  );
}

/** Lightweight hook — returns only count, setCount, refresh for backward compat. */
export function useCartCount(): CartCountContextType {
  const { count, setCount, refresh } = useContext(CartContext);
  return { count, setCount, refresh };
}

/** Full cart context including drawer state, cart data, and badge animation. */
export function useCart(): CartContextType {
  return useContext(CartContext);
}
