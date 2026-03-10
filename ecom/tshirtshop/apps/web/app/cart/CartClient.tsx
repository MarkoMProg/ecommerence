"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Cart } from "@/lib/api/cart";
import {
  updateCartItemQuantity,
  removeFromCart,
} from "@/lib/api/cart";
import { clearCartIdClient, getCartIdClient } from "@/lib/cart-cookie";
import { useCart } from "@/lib/cart-count-context";
import { CART_UPDATED_EVENT } from "@/lib/cart-drawer-context";

interface CartClientProps {
  initialCart: Cart | null;
}

export function CartClient({ initialCart }: CartClientProps) {
  const [cart, setCart] = useState<Cart | null>(initialCart);
  const { setCart: syncCart } = useCart();

  useEffect(() => {
    if (initialCart?.userId && getCartIdClient()) {
      clearCartIdClient();
    }
  }, [initialCart?.userId]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ cart: Cart }>).detail;
      if (detail?.cart) setCart(detail.cart);
    };
    window.addEventListener(CART_UPDATED_EVENT, handler);
    return () => window.removeEventListener(CART_UPDATED_EVENT, handler);
  }, []);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleUpdateQuantity(itemId: string, quantity: number) {
    if (!cart) return;
    setLoading(itemId);
    setError(null);
    try {
      if (quantity < 1) {
        const updated = await removeFromCart(itemId);
        setCart(updated);
        syncCart(updated);
      } else {
        const updated = await updateCartItemQuantity(itemId, quantity);
        setCart(updated);
        syncCart(updated);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update");
    } finally {
      setLoading(null);
    }
  }

  async function handleRemove(itemId: string) {
    if (!cart) return;
    setLoading(itemId);
    setError(null);
    try {
      const updated = await removeFromCart(itemId);
      setCart(updated);
      syncCart(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to remove");
    } finally {
      setLoading(null);
    }
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="rounded-lg border border-white/10 bg-white/5 p-8 text-center sm:p-12">
        <p className="mb-6 text-white/80">Your cart is empty.</p>
        <Link
          href="/shop"
          className="inline-flex min-h-[44px] items-center justify-center rounded-md bg-[#FF4D00] px-6 py-2 text-sm font-medium uppercase tracking-wider text-white transition-colors hover:bg-[#FF4D00]/90"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  const totalDollars = (cart.totalCents / 100).toFixed(2);

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-md border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}
      <div className="overflow-hidden rounded-lg border border-white/10">
        <ul className="divide-y divide-white/10">
          {cart.items.map((item) => {
            const itemTotal = ((item.priceCents * item.quantity) / 100).toFixed(2);
            const isDisabled = loading === item.id;
            const isItemOos = item.stockQuantity <= 0;
            const isItemLowStock = !isItemOos && item.stockQuantity < 10;
            const exceedsStock = !isItemOos && item.quantity > item.stockQuantity;
            const canIncrement = !isItemOos && item.quantity < item.stockQuantity;
            return (
              <li
                key={item.id}
                className="flex flex-col gap-4 bg-white/5 p-4 sm:flex-row sm:items-center sm:gap-6 sm:p-6"
              >
                <Link
                  href={`/shop/${item.slug}`}
                  className="flex shrink-0 gap-4 sm:min-w-[200px]"
                >
                  <div className={`h-20 w-20 shrink-0 overflow-hidden rounded bg-[#1A1A1A] sm:h-24 sm:w-24 ${isItemOos ? "opacity-50" : ""}`}>
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.productName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-white/40 text-xs">
                        —
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 sm:flex-initial">
                    <p className={`truncate font-medium sm:line-clamp-2 ${isItemOos ? "text-white/50" : "text-white"}`}>
                      {item.productName}
                    </p>
                    {item.selectedOption && (
                      <p className="mt-0.5 text-xs text-white/50">
                        Size: {item.selectedOption}
                      </p>
                    )}
                    <p className="mt-0.5 text-sm text-[#E6C068]">${itemTotal}</p>
                    {isItemOos && (
                      <p className="mt-1 text-xs text-red-400">This item is no longer available</p>
                    )}
                    {exceedsStock && (
                      <p className="mt-1 text-xs text-amber-400">
                        Only {item.stockQuantity} unit{item.stockQuantity === 1 ? "" : "s"} available
                      </p>
                    )}
                    {isItemLowStock && !exceedsStock && (
                      <p className="mt-1 text-xs text-amber-400">
                        Only {item.stockQuantity} left
                      </p>
                    )}
                  </div>
                </Link>
                <div className="flex flex-1 items-center justify-between gap-4 sm:justify-end">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateQuantity(item.id, item.quantity - 1)
                      }
                      disabled={isDisabled || item.quantity <= 1}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded border border-white/20 text-white/80 transition-colors hover:border-white/40 hover:text-white disabled:opacity-50"
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <span className="min-w-[2rem] text-center font-medium text-white">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateQuantity(item.id, item.quantity + 1)
                      }
                      disabled={isDisabled || !canIncrement}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded border border-white/20 text-white/80 transition-colors hover:border-white/40 hover:text-white disabled:opacity-50"
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemove(item.id)}
                    disabled={isDisabled}
                    className="text-sm text-white/60 transition-colors hover:text-red-400 disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-lg font-medium text-white">
          Total: <span className="text-[#E6C068]">${totalDollars}</span>
        </p>
        <div className="flex gap-3">
          <Link
            href="/shop"
            className="inline-flex min-h-[44px] items-center justify-center rounded-md border border-white/20 px-6 py-2 text-sm font-medium uppercase tracking-wider text-white transition-colors hover:border-white/40"
          >
            Continue Shopping
          </Link>
          <Link
            href="/checkout"
            className="inline-flex min-h-[44px] items-center justify-center rounded-md bg-[#FF4D00] px-6 py-2 text-sm font-medium uppercase tracking-wider text-white transition-colors hover:bg-[#FF4D00]/90"
          >
            Checkout
          </Link>
        </div>
      </div>
    </div>
  );
}
