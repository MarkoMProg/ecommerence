"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import type { Cart } from "./api/cart";

export const CART_UPDATED_EVENT = "cart-updated";

interface CartDrawerContextType {
  isOpen: boolean;
  /** Open drawer. Pass cart when you already have it (e.g. after add-to-cart). */
  openDrawer: (initialCart?: Cart | null) => void;
  closeDrawer: () => void;
  /** Set by add-to-cart flow so badge can animate. Cleared after use. */
  triggerBadgePop: boolean;
  clearBadgePop: () => void;
}

const CartDrawerContext = createContext<CartDrawerContextType>({
  isOpen: false,
  openDrawer: () => {},
  closeDrawer: () => {},
  triggerBadgePop: false,
  clearBadgePop: () => {},
});

export function CartDrawerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [triggerBadgePop, setTriggerBadgePop] = useState(false);
  const initialCartRef = useRef<Cart | null | undefined>(undefined);

  const openDrawer = useCallback((initialCart?: Cart | null) => {
    initialCartRef.current = initialCart;
    setTriggerBadgePop(initialCart !== undefined && initialCart !== null);
    setIsOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setIsOpen(false);
    initialCartRef.current = undefined;
  }, []);

  const clearBadgePop = useCallback(() => {
    setTriggerBadgePop(false);
  }, []);

  const getInitialCart = useCallback(() => {
    const c = initialCartRef.current;
    initialCartRef.current = undefined;
    return c;
  }, []);

  return (
    <CartDrawerContext.Provider
      value={{
        isOpen,
        openDrawer,
        closeDrawer,
        triggerBadgePop,
        clearBadgePop,
      }}
    >
      <CartDrawerInitialCartBridge getInitialCart={getInitialCart}>
        {children}
      </CartDrawerInitialCartBridge>
    </CartDrawerContext.Provider>
  );
}

/** Internal: exposes getInitialCart to CartDrawer. */
const CartDrawerInitialCartBridgeContext = createContext<{
  getInitialCart: () => Cart | null | undefined;
} | null>(null);

function CartDrawerInitialCartBridge({
  getInitialCart,
  children,
}: {
  getInitialCart: () => Cart | null | undefined;
  children: React.ReactNode;
}) {
  return (
    <CartDrawerInitialCartBridgeContext.Provider value={{ getInitialCart }}>
      {children}
    </CartDrawerInitialCartBridgeContext.Provider>
  );
}

export function useCartDrawerInitialCart() {
  const ctx = useContext(CartDrawerInitialCartBridgeContext);
  return ctx?.getInitialCart ?? (() => undefined);
}

export function useCartDrawer(): CartDrawerContextType {
  return useContext(CartDrawerContext);
}
