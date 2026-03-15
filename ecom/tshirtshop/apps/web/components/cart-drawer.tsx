"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { X, Minus, Plus, ShoppingBag } from "lucide-react";
import type { Cart, CartItem } from "@/lib/api/cart";
import {
  fetchCartClient,
  updateCartItemQuantity,
  removeFromCart,
} from "@/lib/api/cart";
import { useCartDrawer, useCartDrawerInitialCart } from "@/lib/cart-drawer-context";
import { useCart } from "@/lib/cart-count-context";
import { CART_UPDATED_EVENT } from "@/lib/cart-drawer-context";

function CartDrawerItem({
  item,
  onUpdate,
  onRemove,
  loading,
  isJustAdded,
}: {
  item: CartItem;
  onUpdate: (itemId: string, quantity: number) => void;
  onRemove: (itemId: string) => void;
  loading: boolean;
  isJustAdded?: boolean;
}) {
  const isOos = item.stockQuantity <= 0;
  const exceedsStock = !isOos && item.quantity > item.stockQuantity;
  const canIncrement = !isOos && item.quantity < item.stockQuantity;

  return (
    <li className="flex gap-4 border-b border-white/10 py-4 last:border-0">
      <Link
        href={`/shop/${item.slug}`}
        className="relative block h-20 w-20 shrink-0 overflow-hidden rounded-md bg-white/5"
        onClick={(e) => e.stopPropagation()}
      >
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.productName}
            fill
            sizes="80px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-white/40 text-xs">
            —
          </div>
        )}
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Link
            href={`/shop/${item.slug}`}
            className="block truncate font-medium text-white hover:text-white/80"
            onClick={(e) => e.stopPropagation()}
          >
            {item.productName}
          </Link>
          {isJustAdded && (
            <span className="shrink-0 rounded bg-[#FF4D00]/20 px-1.5 py-0.5 text-[10px] font-medium uppercase text-[#FF4D00]">
              Added
            </span>
          )}
        </div>
        {item.selectedOption && (
          <p className="mt-0.5 text-xs text-white/50">
            Size: {item.selectedOption}
          </p>
        )}
        <p className="mt-0.5 text-sm text-[#E6C068]">
          ${((item.priceCents * item.quantity) / 100).toFixed(2)}
        </p>
        {isOos && (
          <p className="mt-1 text-xs text-red-400">
            This item is no longer available
          </p>
        )}
        {exceedsStock && (
          <p className="mt-1 text-xs text-amber-400">
            Only {item.stockQuantity} unit{item.stockQuantity === 1 ? "" : "s"} available
          </p>
        )}
        <div className="mt-2 flex items-center gap-2">
          <div className="flex items-center gap-1 rounded border border-white/20">
            <button
              type="button"
              onClick={() => onUpdate(item.id, item.quantity - 1)}
              disabled={loading || item.quantity <= 1}
              className="flex h-8 w-8 items-center justify-center text-white/80 transition-colors hover:text-white disabled:opacity-50"
              aria-label="Decrease quantity"
            >
              <Minus className="size-3.5" strokeWidth={2} />
            </button>
            <span className="min-w-[2rem] text-center text-sm font-medium text-white">
              {item.quantity}
            </span>
            <button
              type="button"
              onClick={() => onUpdate(item.id, item.quantity + 1)}
              disabled={loading || !canIncrement}
              className="flex h-8 w-8 items-center justify-center text-white/80 transition-colors hover:text-white disabled:opacity-50"
              aria-label="Increase quantity"
            >
              <Plus className="size-3.5" strokeWidth={2} />
            </button>
          </div>
          <button
            type="button"
            onClick={() => onRemove(item.id)}
            disabled={loading}
            className="text-xs text-white/60 transition-colors hover:text-red-400 disabled:opacity-50"
          >
            Remove
          </button>
        </div>
      </div>
    </li>
  );
}

export function CartDrawer() {
  const { isOpen, closeDrawer } = useCartDrawer();
  const getInitialCart = useCartDrawerInitialCart();
  const { setCart: syncCart, lastAddedProductId, lastAddedSelectedOption } = useCart();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [fetching, setFetching] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number | null>(null);

  const loadCart = useCallback(async () => {
    const initial = getInitialCart();
    if (initial !== undefined) {
      setCart(initial ?? null);
      return;
    }
    setFetching(true);
    try {
      const c = await fetchCartClient();
      setCart(c);
    } finally {
      setFetching(false);
    }
  }, [getInitialCart]);

  useEffect(() => {
    if (isOpen) {
      loadCart();
      document.body.style.overflow = "hidden";
    } else {
      setCart(null);
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, loadCart]);

  const handleUpdate = useCallback(
    async (itemId: string, quantity: number) => {
      if (!cart) return;
      setLoading(itemId);
      try {
        if (quantity < 1) {
          const updated = await removeFromCart(itemId);
          setCart(updated);
          syncCart(updated);
          window.dispatchEvent(new CustomEvent(CART_UPDATED_EVENT, { detail: { cart: updated } }));
        } else {
          const updated = await updateCartItemQuantity(itemId, quantity);
          setCart(updated);
          syncCart(updated);
          window.dispatchEvent(new CustomEvent(CART_UPDATED_EVENT, { detail: { cart: updated } }));
        }
      } catch {
        // Keep current cart state
      } finally {
        setLoading(null);
      }
    },
    [cart, syncCart]
  );

  const handleRemove = useCallback(
    async (itemId: string) => {
      if (!cart) return;
      setLoading(itemId);
      try {
        const updated = await removeFromCart(itemId);
        setCart(updated);
        syncCart(updated);
        window.dispatchEvent(new CustomEvent(CART_UPDATED_EVENT, { detail: { cart: updated } }));
      } catch {
        // Keep current cart state
      } finally {
        setLoading(null);
      }
    },
    [cart, syncCart]
  );

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDrawer();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, closeDrawer]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) closeDrawer();
    },
    [closeDrawer]
  );

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartY.current = touch ? touch.clientY : null;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartY.current == null) return;
      const touch = e.changedTouches[0];
      if (!touch) return;
      const touchEndY = touch.clientY;
      const delta = touchEndY - touchStartY.current;
      touchStartY.current = null;
      if (delta > 80) closeDrawer();
    },
    [closeDrawer]
  );

  const hasOosItems = cart?.items.some((i) => i.stockQuantity <= 0) ?? false;

  if (!isOpen) return null;

  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        className="fixed inset-0 z-[100] flex justify-end"
      >
        <div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
          aria-hidden="true"
          onClick={handleBackdropClick}
        />
        <div
          ref={panelRef}
          className={[
            "relative z-10 flex h-full w-full flex-col bg-[#0D0D0D] shadow-2xl",
            "animate-in slide-in-from-right duration-300 ease-out",
            "lg:h-full lg:max-h-full lg:w-[420px]",
            "lg:min-h-0",
          ].join(" ")}
          style={{
            maxWidth: "min(100vw, 420px)",
          }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/[0.07] px-5">
            <h2
              className="font-bold uppercase tracking-tight text-white"
              style={{
                fontFamily: "var(--font-space-grotesk), sans-serif",
                fontSize: "15px",
                letterSpacing: "0.2em",
              }}
            >
              Cart
            </h2>
            <button
              type="button"
              onClick={closeDrawer}
              className="flex h-10 w-10 items-center justify-center text-white/50 transition-colors hover:text-white"
              aria-label="Close cart"
            >
              <X className="size-5" strokeWidth={1.5} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4">
            {fetching && !cart ? (
              <div className="flex flex-col items-center justify-center py-16 text-white/50">
                <div className="animate-pulse">Loading cart…</div>
              </div>
            ) : !cart || cart.items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <ShoppingBag className="mb-4 size-12 text-white/20" strokeWidth={1} />
                <p className="mb-6 text-white/80">Your cart is empty</p>
                <Link
                  href="/shop"
                  onClick={closeDrawer}
                  className="inline-flex min-h-[48px] items-center justify-center rounded-md bg-[#FF4D00] px-6 py-2 text-sm font-medium uppercase tracking-wider text-white transition-colors hover:bg-[#FF4D00]/90"
                >
                  Start shopping
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-white/10">
                {cart.items.map((item) => (
                  <CartDrawerItem
                    key={item.id}
                    item={item}
                    onUpdate={handleUpdate}
                    onRemove={handleRemove}
                    loading={loading === item.id}
                    isJustAdded={
                      lastAddedProductId === item.productId &&
                      lastAddedSelectedOption === (item.selectedOption ?? null)
                    }
                  />
                ))}
              </ul>
            )}
          </div>

          {cart && cart.items.length > 0 && (
            <div className="shrink-0 border-t border-white/10 bg-[#0D0D0D] p-5">
              {hasOosItems && (
                <p className="mb-3 text-xs text-red-400">
                  Remove unavailable items before checkout.
                </p>
              )}
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm uppercase tracking-wider text-white/60">
                  Subtotal
                </span>
                <span className="text-lg font-medium text-[#E6C068]">
                  ${(cart.totalCents / 100).toFixed(2)}
                </span>
              </div>
              <div className="flex flex-col gap-3">
                {hasOosItems ? (
                  <span
                    className="flex min-h-[56px] cursor-not-allowed items-center justify-center rounded-md bg-white/10 px-6 py-3 text-sm font-medium uppercase tracking-wider text-white/50 sm:min-h-[52px]"
                    aria-disabled="true"
                  >
                    Checkout (remove unavailable items)
                  </span>
                ) : (
                  <Link
                    href="/checkout"
                    onClick={closeDrawer}
                    className="flex min-h-[56px] items-center justify-center rounded-md bg-[#FF4D00] px-6 py-4 text-base font-medium uppercase tracking-wider text-white transition-colors hover:bg-[#FF4D00]/90 sm:min-h-[52px] sm:py-3 sm:text-sm"
                  >
                    Checkout
                  </Link>
                )}
                <Link
                  href="/cart"
                  onClick={closeDrawer}
                  className="flex min-h-[48px] items-center justify-center rounded-md border border-white/20 px-6 py-2 text-sm font-medium uppercase tracking-wider text-white transition-colors hover:border-white/40"
                >
                  View cart
                </Link>
                <button
                  type="button"
                  onClick={closeDrawer}
                  className="text-sm text-white/60 transition-colors hover:text-white"
                >
                  Continue shopping
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
