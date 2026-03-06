"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  MapPin,
  CreditCard,
  ArrowRight,
  Plus,
  RotateCcw,
  Package,
} from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { fetchMyOrders, reorderItems } from "@/lib/api/orders";
import type { Order, ReorderResult } from "@/lib/api/orders";
import { fetchMyAddresses } from "@/lib/api/addresses";
import type { SavedAddress } from "@/lib/api/addresses";
import { fetchMyPaymentMethods } from "@/lib/api/billing";
import type { SavedPaymentMethod } from "@/lib/api/billing";

// ── Helpers ──────────────────────────────────────────────────────────────────

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

function cardBrandLabel(brand: string): string {
  const map: Record<string, string> = {
    visa: "Visa",
    mastercard: "MC",
    amex: "Amex",
    discover: "Disc.",
    jcb: "JCB",
    unionpay: "UP",
    diners: "Diners",
  };
  return map[brand.toLowerCase()] ?? brand.toUpperCase().slice(0, 4);
}

// ── Section shell ─────────────────────────────────────────────────────────────

function SectionPreview({
  title,
  icon: Icon,
  href,
  empty,
  emptyLabel,
  emptyHref,
  emptyLinkLabel,
  children,
}: {
  title: string;
  icon: React.ElementType;
  href: string;
  empty: boolean;
  emptyLabel: string;
  emptyHref?: string;
  emptyLinkLabel?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#1A1A1A] p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="size-4 text-white/40" />
          <h3
            className="text-[11px] font-bold uppercase tracking-widest text-white/60"
            style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
          >
            {title}
          </h3>
        </div>
        <Link
          href={href}
          className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-[#FF4D00]/80 hover:text-[#FF4D00] transition-colors"
        >
          View all
          <ArrowRight className="size-3" />
        </Link>
      </div>
      {empty ? (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <p className="text-xs text-white/40">{emptyLabel}</p>
          {emptyHref && emptyLinkLabel && (
            <Link
              href={emptyHref}
              className="flex items-center gap-1.5 rounded-md border border-white/20 px-3 py-1.5 text-[10px] uppercase tracking-wider text-white/60 hover:bg-white/5 hover:text-white transition-colors"
            >
              <Plus className="size-3" />
              {emptyLinkLabel}
            </Link>
          )}
        </div>
      ) : (
        children
      )}
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

interface DashboardState {
  orders: Order[] | null;
  addresses: SavedAddress[] | null;
  paymentMethods: SavedPaymentMethod[] | null;
  loaded: boolean;
}

interface ReorderState {
  status: "idle" | "loading" | "done" | "error";
  result?: ReorderResult;
  error?: string;
}

export default function AccountDashboard() {
  const { session } = useAuth();
  const [data, setData] = useState<DashboardState>({
    orders: null,
    addresses: null,
    paymentMethods: null,
    loaded: false,
  });
  const [reorderStates, setReorderStates] = useState<
    Record<string, ReorderState>
  >({});

  useEffect(() => {
    if (!session?.user) return;
    let cancelled = false;
    Promise.allSettled([
      fetchMyOrders(),
      fetchMyAddresses(),
      fetchMyPaymentMethods().catch((err: Error & { code?: string }) => {
        if (err.code === "STRIPE_NOT_CONFIGURED") return [];
        throw err;
      }),
    ]).then(([ordersRes, addressesRes, pmRes]) => {
      if (cancelled) return;
      setData({
        orders: ordersRes.status === "fulfilled" ? ordersRes.value : null,
        addresses:
          addressesRes.status === "fulfilled" ? addressesRes.value : null,
        paymentMethods: pmRes.status === "fulfilled" ? pmRes.value : null,
        loaded: true,
      });
    });
    return () => {
      cancelled = true;
    };
  }, [session?.user]);

  const user = session?.user;
  const firstName = user?.name?.split(" ")[0] ?? "there";

  const recentOrders = data.orders?.slice(0, 3) ?? [];
  const previewAddresses = data.addresses?.slice(0, 2) ?? [];
  const previewPMs = data.paymentMethods?.slice(0, 2) ?? [];

  async function handleReorder(orderId: string) {
    setReorderStates((p) => ({ ...p, [orderId]: { status: "loading" } }));
    try {
      const result = await reorderItems(orderId);
      setReorderStates((p) => ({ ...p, [orderId]: { status: "done", result } }));
    } catch (err) {
      setReorderStates((p) => ({
        ...p,
        [orderId]: {
          status: "error",
          error: err instanceof Error ? err.message : "Failed",
        },
      }));
    }
  }

  return (
    <div className="space-y-8 pb-12">
      {/* ── Greeting ── */}
      <div className="flex items-end justify-between border-b border-white/10 pb-6">
        <div>
          <p className="mb-1 text-[10px] uppercase tracking-widest text-white/40">
            Dashboard
          </p>
          <h1
            className="text-2xl font-bold uppercase tracking-tight text-white sm:text-3xl"
            style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
          >
            Welcome back, {firstName}
          </h1>
        </div>
        {data.loaded && data.orders !== null && (
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/50">
            {data.orders.length}{" "}
            {data.orders.length === 1 ? "order" : "orders"}
          </span>
        )}
      </div>

      {/* ── Quick actions ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            href: "/shop",
            label: "Continue Shopping",
            icon: ShoppingBag,
          },
          {
            href: "/account/orders",
            label: "All Orders",
            icon: Package,
          },
          {
            href: "/account/addresses",
            label: "Add Address",
            icon: MapPin,
          },
          {
            href: "/account/payment-methods",
            label: "Add Payment",
            icon: CreditCard,
          },
        ].map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center gap-2.5 rounded-xl border border-white/10 bg-[#1A1A1A] px-3 py-4 text-center text-[10px] uppercase tracking-wider text-white/60 transition-all hover:border-[#FF4D00]/30 hover:bg-[#FF4D00]/5 hover:text-white"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5">
              <Icon className="size-4" />
            </div>
            {label}
          </Link>
        ))}
      </div>

      {/* ── Recent Orders ── */}
      <div className="rounded-xl border border-white/10 bg-[#1A1A1A] p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="size-4 text-white/40" />
            <h3
              className="text-[11px] font-bold uppercase tracking-widest text-white/60"
              style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
            >
              Recent Orders
            </h3>
          </div>
          <Link
            href="/account/orders"
            className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-[#FF4D00]/80 hover:text-[#FF4D00] transition-colors"
          >
            View all
            <ArrowRight className="size-3" />
          </Link>
        </div>

        {!data.loaded ? (
          <div className="space-y-3 py-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-10 animate-pulse rounded-lg bg-white/5"
              />
            ))}
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <Package className="size-8 text-white/10" />
            <p className="text-xs text-white/40">No orders yet.</p>
            <Link
              href="/shop"
              className="text-xs text-[#FF4D00] hover:underline"
            >
              Start shopping →
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-white/5">
            {recentOrders.map((order) => {
              const rs = reorderStates[order.id];
              const isReordering = rs?.status === "loading";
              return (
                <li
                  key={order.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <Link
                      href={`/checkout/confirmation?orderId=${encodeURIComponent(order.id)}`}
                      className="block truncate font-mono text-xs text-white hover:underline"
                    >
                      #{order.id.slice(-8).toUpperCase()}
                    </Link>
                    <p className="text-[10px] text-white/40">
                      {formatDate(order.createdAt)} · {order.items.length}{" "}
                      item{order.items.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] uppercase tracking-wider ${statusBadge(order.status)}`}
                    >
                      {order.status}
                    </span>
                    <span className="text-xs font-medium text-[#E6C068]">
                      ${(order.totalCents / 100).toFixed(2)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleReorder(order.id)}
                      disabled={isReordering}
                      className="flex items-center gap-1 rounded border border-white/20 px-2 py-1 text-[10px] uppercase tracking-wider text-white/50 hover:border-[#FF4D00]/40 hover:text-[#FF4D00]/80 disabled:opacity-40 transition-colors"
                      title="Reorder"
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
                  {rs?.status === "done" && rs.result && (
                    <p className="w-full text-[10px] text-emerald-400">
                      {rs.result.addedCount + rs.result.adjustedCount} item
                      {rs.result.addedCount + rs.result.adjustedCount !== 1
                        ? "s"
                        : ""}{" "}
                      added to cart.{" "}
                      <Link href="/cart" className="underline">
                        View cart
                      </Link>
                    </p>
                  )}
                  {rs?.status === "error" && (
                    <p className="w-full text-[10px] text-red-400">
                      {rs.error}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* ── Addresses + Payment Methods grid ── */}
      <div className="grid gap-5 sm:grid-cols-2">
        {/* Addresses preview */}
        <SectionPreview
          title="Addresses"
          icon={MapPin}
          href="/account/addresses"
          empty={data.loaded && previewAddresses.length === 0}
          emptyLabel="No saved addresses."
          emptyHref="/account/addresses"
          emptyLinkLabel="Add address"
        >
          <ul className="space-y-2">
            {!data.loaded
              ? [1, 2].map((i) => (
                  <li
                    key={i}
                    className="h-14 animate-pulse rounded-lg bg-white/5"
                  />
                ))
              : previewAddresses.map((addr) => (
                  <li
                    key={addr.id}
                    className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-medium text-white">
                        {addr.fullName}
                      </p>
                      <div className="flex gap-1">
                        {addr.isDefaultShipping && (
                          <span className="rounded border border-[#FF4D00]/30 bg-[#FF4D00]/10 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-[#FF4D00]/80">
                            Ship
                          </span>
                        )}
                        {addr.isDefaultBilling && (
                          <span className="rounded border border-purple-500/30 bg-purple-500/10 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-purple-300/80">
                            Bill
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="mt-0.5 text-[10px] text-white/40">
                      {addr.line1}, {addr.city}
                    </p>
                  </li>
                ))}
          </ul>
        </SectionPreview>

        {/* Payment methods preview */}
        <SectionPreview
          title="Payment Methods"
          icon={CreditCard}
          href="/account/payment-methods"
          empty={data.loaded && previewPMs.length === 0}
          emptyLabel="No saved payment methods."
          emptyHref="/account/payment-methods"
          emptyLinkLabel="Add card"
        >
          <ul className="space-y-2">
            {!data.loaded
              ? [1, 2].map((i) => (
                  <li
                    key={i}
                    className="h-10 animate-pulse rounded-lg bg-white/5"
                  />
                ))
              : previewPMs.map((pm) => (
                  <li
                    key={pm.id}
                    className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5"
                  >
                    <div className="flex items-center gap-3">
                      <span className="rounded border border-white/20 bg-white/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest text-white/70">
                        {cardBrandLabel(pm.brand)}
                      </span>
                      <span className="font-mono text-xs text-white/70">
                        ···· {pm.last4}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-white/30">
                        {pm.expMonth.toString().padStart(2, "0")}/
                        {pm.expYear.toString().slice(-2)}
                      </span>
                      {pm.isDefault && (
                        <span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-emerald-400/80">
                          Default
                        </span>
                      )}
                    </div>
                  </li>
                ))}
          </ul>
        </SectionPreview>
      </div>
    </div>
  );
}
