"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Package,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  XCircle,
} from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { fetchMyOrders, reorderItems, cancelOrder, CancelOrderError } from "@/lib/api/orders";
import type { Order, ReorderResult } from "@/lib/api/orders";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

function statusBadge(status: string): string {
  const map: Record<string, string> = {
    pending: "bg-amber-500/20 text-amber-300",
    paid: "bg-emerald-500/20 text-emerald-300",
    shipped: "bg-blue-500/20 text-blue-300",
    completed: "bg-white/10 text-white/70",
    cancelled: "bg-red-500/20 text-red-300",
    refunded: "bg-slate-500/20 text-slate-300",
  };
  return map[status] ?? "bg-white/10 text-white/50";
}

// ── ReorderFeedback ───────────────────────────────────────────────────────────

interface ReorderState {
  status: "idle" | "loading" | "done" | "error";
  result?: ReorderResult;
  error?: string;
  detailOpen?: boolean;
}

interface CancelState {
  status: "idle" | "confirming" | "loading" | "done" | "error";
  error?: string;
}

function ReorderFeedback({
  state,
  onToggleDetail,
}: {
  state: ReorderState;
  onToggleDetail: () => void;
}) {
  if (state.status === "error") {
    return (
      <div className="mt-2 flex items-center gap-2 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
        <AlertCircle className="size-3.5 shrink-0" />
        {state.error}
      </div>
    );
  }
  if (state.status !== "done" || !state.result) return null;

  const { addedCount, adjustedCount, unavailableCount, items } = state.result;
  const totalAdded = addedCount + adjustedCount;
  const hasUnavailable = unavailableCount > 0;
  const allUnavailable = totalAdded === 0;

  return (
    <div className="mt-2 space-y-1">
      <div
        className={`flex items-center justify-between rounded-md border px-3 py-2 text-xs ${
          allUnavailable
            ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
            : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
        }`}
      >
        <div className="flex items-center gap-2">
          {allUnavailable ? (
            <AlertCircle className="size-3.5 shrink-0" />
          ) : (
            <CheckCircle2 className="size-3.5 shrink-0" />
          )}
          <span>
            {allUnavailable
              ? "All items are currently unavailable."
              : totalAdded === 1
                ? "1 item added to cart."
                : `${totalAdded} items added to cart.`}
            {hasUnavailable && !allUnavailable && (
              <span className="ml-1 text-amber-300">
                {unavailableCount} unavailable.
              </span>
            )}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {!allUnavailable && (
            <Link href="/cart" className="underline hover:no-underline">
              View cart
            </Link>
          )}
          {items.length > 0 && (
            <button
              type="button"
              onClick={onToggleDetail}
              className="flex items-center gap-0.5 text-white/50 hover:text-white"
              aria-label={state.detailOpen ? "Hide details" : "Show details"}
            >
              {state.detailOpen ? (
                <ChevronUp className="size-3.5" />
              ) : (
                <ChevronDown className="size-3.5" />
              )}
            </button>
          )}
        </div>
      </div>

      {state.detailOpen && (
        <ul className="divide-y divide-white/5 rounded-md border border-white/10 bg-white/5">
          {items.map((item, i) => (
            <li
              key={i}
              className="flex items-center justify-between px-3 py-2 text-[11px]"
            >
              <span className="text-white/70">{item.productNameAtOrder}</span>
              <span
                className={
                  item.status === "unavailable"
                    ? "text-red-400"
                    : item.status === "adjusted"
                      ? "text-amber-300"
                      : "text-emerald-400"
                }
              >
                {item.status === "unavailable"
                  ? (item.reason ?? "Unavailable")
                  : item.status === "adjusted"
                    ? `Qty adjusted: ${item.requestedQuantity} → ${item.addedQuantity}`
                    : `Added ×${item.addedQuantity}`}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Cancel order inline (account list) ────────────────────────────────────────

function CancelOrderInline({
  state,
  onConfirm,
  onStartConfirm,
  onCancelConfirm,
}: {
  orderId: string;
  state: CancelState;
  onConfirm: () => void;
  onStartConfirm: () => void;
  onCancelConfirm: () => void;
}) {
  const isConfirming = state.status === "confirming" || state.status === "loading";
  if (isConfirming) {
    const isLoading = state.status === "loading";
    return (
      <div className="flex flex-col gap-2 rounded border border-white/20 bg-white/5 px-3 py-2">
        <p className="text-[11px] text-white/80">
          This will cancel your order and issue a full refund to your original payment method.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="rounded border border-red-500/50 bg-red-500/20 px-2 py-1 text-[10px] font-medium uppercase text-red-300 hover:bg-red-500/30 disabled:opacity-50"
          >
            {isLoading ? "Cancelling…" : "Yes, cancel"}
          </button>
          <button
            type="button"
            onClick={onCancelConfirm}
            disabled={isLoading}
            className="rounded border border-white/20 px-2 py-1 text-[10px] uppercase text-white/60 hover:bg-white/5 disabled:opacity-50"
          >
            No
          </button>
        </div>
      </div>
    );
  }
  if (state.status === "error") {
    return (
      <div className="flex items-center gap-1.5 rounded border border-red-500/30 bg-red-500/10 px-2 py-1 text-[10px] text-red-300">
        <AlertCircle className="size-3 shrink-0" />
        {state.error}
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={onStartConfirm}
      className="flex items-center gap-1.5 rounded border border-white/20 px-2.5 py-1 text-[10px] uppercase tracking-wider text-white/60 hover:border-red-500/40 hover:text-red-400 transition-colors"
      title="Cancel order and get a full refund"
    >
      <XCircle className="size-3" />
      <span className="hidden sm:inline">Cancel order</span>
    </button>
  );
}

// ── Orders page ───────────────────────────────────────────────────────────────

export default function OrdersPage() {
  const { session } = useAuth();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [reorderStates, setReorderStates] = useState<
    Record<string, ReorderState>
  >({});
  const [cancelStates, setCancelStates] = useState<
    Record<string, CancelState>
  >({});

  useEffect(() => {
    if (!session?.user) return;
    let cancelled = false;
    fetchMyOrders().then((data) => {
      if (!cancelled) {
        setOrders(data ?? []);
        setLoaded(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [session?.user]);

  async function handleReorder(orderId: string) {
    setReorderStates((p) => ({ ...p, [orderId]: { status: "loading" } }));
    try {
      const result = await reorderItems(orderId);
      setReorderStates((p) => ({
        ...p,
        [orderId]: {
          status: "done",
          result,
          detailOpen: result.unavailableCount > 0,
        },
      }));
    } catch (err) {
      setReorderStates((p) => ({
        ...p,
        [orderId]: {
          status: "error",
          error: err instanceof Error ? err.message : "Failed to reorder",
        },
      }));
    }
  }

  function toggleReorderDetail(orderId: string) {
    setReorderStates((p) => ({
      ...p,
      [orderId]: { ...p[orderId]!, detailOpen: !p[orderId]?.detailOpen },
    }));
  }

  const canCancelOrder = (order: Order) =>
    order.status === "paid";

  async function handleCancelOrder(orderId: string) {
    setCancelStates((p) => ({ ...p, [orderId]: { status: "loading" } }));
    try {
      const updated = await cancelOrder(orderId);
      setCancelStates((p) => ({ ...p, [orderId]: { status: "done" } }));
      setOrders((prev) =>
        prev
          ? prev.map((o) => (o.id === orderId ? updated : o))
          : null
      );
    } catch (err) {
      const msg =
        err instanceof CancelOrderError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to cancel order";
      setCancelStates((p) => ({
        ...p,
        [orderId]: { status: "error", error: msg },
      }));
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="border-b border-white/10 pb-6">
        <p className="mb-1 text-[10px] uppercase tracking-widest text-white/40">
          Account
        </p>
        <h1
          className="text-2xl font-bold uppercase tracking-tight text-white sm:text-3xl"
          style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
        >
          Orders
        </h1>
        <p className="mt-1 text-sm text-white/50">
          Your full order history
        </p>
      </div>

      {/* Content */}
      <div className="rounded-xl border border-white/10 bg-[#1A1A1A]">
        {!loaded ? (
          <div className="space-y-px">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-16 animate-pulse bg-white/5 first:rounded-t-xl last:rounded-b-xl"
              />
            ))}
          </div>
        ) : orders === null ? (
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <AlertCircle className="size-8 text-white/10" />
            <p className="text-sm text-white/40">
              Unable to load orders. Please try again later.
            </p>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center gap-4 px-6 py-16 text-center">
            <Package className="size-10 text-white/10" />
            <div>
              <p className="text-sm text-white/60">No orders yet.</p>
              <p className="mt-1 text-xs text-white/30">
                Your future orders will appear here.
              </p>
            </div>
            <Link
              href="/shop"
              className="mt-1 rounded-md bg-[#FF4D00] px-5 py-2 text-[11px] font-medium uppercase tracking-wider text-white hover:bg-[#FF4D00]/90 transition-colors"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-white/5">
            {orders.map((order) => {
              const rs = reorderStates[order.id];
              const isReordering = rs?.status === "loading";
              return (
                <li key={order.id} className="px-5 py-4 first:rounded-t-xl last:rounded-b-xl">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    {/* Order info */}
                    <div className="min-w-0">
                      <Link
                        href={`/checkout/confirmation?orderId=${encodeURIComponent(order.id)}`}
                        className="block font-mono text-sm text-white hover:underline"
                      >
                        #{order.id.slice(-10).toUpperCase()}
                      </Link>
                      <p className="text-[11px] text-white/40">
                        {formatDate(order.createdAt)} ·{" "}
                        {order.items.length} item
                        {order.items.length !== 1 ? "s" : ""}
                        {order.shippingCity
                          ? ` · ${order.shippingCity}`
                          : ""}
                      </p>
                    </div>

                    {/* Status + total + actions */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] uppercase tracking-wider ${statusBadge(order.status)}`}
                      >
                        {order.status === "cancelled" && order.stripeRefundId
                          ? "Cancelled · Refunded"
                          : order.status}
                      </span>
                      <span className="font-medium text-[#E6C068]">
                        ${(order.totalCents / 100).toFixed(2)}
                      </span>
                      {canCancelOrder(order) && (
                        <CancelOrderInline
                          orderId={order.id}
                          state={cancelStates[order.id] ?? { status: "idle" }}
                          onConfirm={() => handleCancelOrder(order.id)}
                          onStartConfirm={() =>
                            setCancelStates((p) => ({
                              ...p,
                              [order.id]: { status: "confirming" },
                            }))
                          }
                          onCancelConfirm={() =>
                            setCancelStates((p) => ({
                              ...p,
                              [order.id]: { status: "idle" },
                            }))
                          }
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => handleReorder(order.id)}
                        disabled={isReordering}
                        className="flex items-center gap-1.5 rounded border border-white/20 px-2.5 py-1 text-[10px] uppercase tracking-wider text-white/60 hover:border-[#FF4D00]/40 hover:text-[#FF4D00]/80 disabled:opacity-50 transition-colors"
                        title="Add items from this order to cart"
                      >
                        {isReordering ? (
                          <span className="size-3 animate-spin rounded-full border border-white/40 border-t-white" />
                        ) : (
                          <RotateCcw className="size-3" />
                        )}
                        <span className="hidden sm:inline">
                          {isReordering ? "Adding…" : "Reorder"}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Item list (collapsed) */}
                  <ul className="mt-2 space-y-0.5">
                    {order.items.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-center justify-between text-[11px] text-white/40"
                      >
                        <span>
                          {item.productNameAtOrder} × {item.quantity}
                        </span>
                        <span>
                          ${((item.priceCentsAtOrder * item.quantity) / 100).toFixed(2)}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {rs && (
                    <ReorderFeedback
                      state={rs}
                      onToggleDetail={() => toggleReorderDetail(order.id)}
                    />
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
