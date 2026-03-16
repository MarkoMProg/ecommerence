"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { Order } from "@/lib/api/orders";
import { fetchOrder } from "@/lib/api/orders";
import {
  adminUpdateOrderStatus,
  adminRefundOrder,
} from "@/lib/api/admin";
import { AdminSelect } from "@/components/ui/admin-select";
import { Button } from "@/components/ui/button";

const STATUS_OPTIONS = ["pending", "paid", "shipped", "completed", "cancelled", "refunded"] as const;
const REFUNDABLE_STATUSES = ["paid", "shipped", "completed"] as const;

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function AdminOrderDetailPage() {
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [refunding, setRefunding] = useState(false);

  useEffect(() => {
    if (!orderId?.trim()) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    fetchOrder(orderId).then((o) => {
      if (!cancelled) {
        setOrder(o ?? null);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  const handleStatusChange = async (newStatus: string) => {
    if (!order) return;
    setUpdating(true);
    const updated = await adminUpdateOrderStatus(order.id, newStatus);
    if (updated) {
      setOrder({
        ...order,
        status: updated.status,
        paidAt: updated.paidAt ?? order.paidAt,
      });
    }
    setUpdating(false);
  };

  const handleRefund = async () => {
    if (!order || !confirm("Refund this order? This cannot be undone.")) return;
    setRefunding(true);
    const updated = await adminRefundOrder(order.id);
    if (updated) {
      setOrder({ ...order, status: updated.status });
    }
    setRefunding(false);
  };

  if (loading) {
    return (
      <p className="py-8 text-white/60">Loading order…</p>
    );
  }

  if (!order) {
    return (
      <div className="space-y-4">
        <p className="py-8 text-white/60">Order not found.</p>
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-2 text-sm text-[#FF4D00] hover:underline"
        >
          Back to Orders
        </Link>
      </div>
    );
  }

  const canRefund = REFUNDABLE_STATUSES.includes(
    order.status as (typeof REFUNDABLE_STATUSES)[number]
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1
          className="text-2xl font-bold uppercase tracking-tight text-white sm:text-4xl"
          style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
        >
          Order {order.id.slice(0, 8)}…
        </h1>
        <Link
          href="/admin/orders"
          className="text-sm text-[#FF4D00] hover:underline"
        >
          ← Back to Orders
        </Link>
      </div>

      <div className="rounded-lg border border-white/10 bg-white/5 p-6">
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-white/60">Status</p>
            <AdminSelect
              value={order.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              disabled={updating}
              className="mt-1"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </AdminSelect>
          </div>
          {canRefund && (
            <div className="flex items-end">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefund}
                disabled={refunding}
              >
                {refunding ? "Refunding…" : "Refund"}
              </Button>
            </div>
          )}
        </div>

        <div className="grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-widest text-white/60">Created</p>
            <p className="text-white/80">{formatDate(order.createdAt)}</p>
          </div>
          {order.paidAt && (
            <div>
              <p className="text-xs uppercase tracking-widest text-white/60">Paid</p>
              <p className="text-white/80">{formatDate(order.paidAt)}</p>
            </div>
          )}
        </div>
      </div>

      {order.items.length > 0 && (
        <div className="rounded-lg border border-white/10 bg-white/5 p-6">
          {order.status === "cancelled" && (
            <p className="mb-6 rounded-md border border-amber-500/50 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
              {order.stripeRefundId
                ? "This order has been cancelled and a full refund has been initiated."
                : "This order has been cancelled."}
            </p>
          )}
          {order.status === "refunded" && (
            <p className="mb-6 rounded-md border border-emerald-500/50 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              This order has been refunded.
            </p>
          )}
          <h2 className="mb-6 text-sm font-medium uppercase tracking-wider text-white">
            Order details
          </h2>
          <ul className="mb-6 space-y-4 border-b border-white/10 pb-6">
            {order.items.map((item) => {
              const itemTotal = (
                (item.priceCentsAtOrder * item.quantity) /
                100
              ).toFixed(2);
              return (
                <li key={item.id} className="flex gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">
                      {item.productNameAtOrder}
                    </p>
                    <p className="text-xs text-white/60">
                      Qty {item.quantity} × $
                      {(item.priceCentsAtOrder / 100).toFixed(2)}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-medium text-[#E6C068]">
                    ${itemTotal}
                  </p>
                </li>
              );
            })}
          </ul>
          <div className="mb-4 space-y-2">
            <div className="flex justify-between text-sm text-white/80">
              <span>Subtotal</span>
              <span>${(order.subtotalCents / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-white/80">
              <span>Shipping</span>
              <span>${(order.shippingCents / 100).toFixed(2)}</span>
            </div>
          </div>
          <div className="flex justify-between border-t border-white/10 pt-4 text-lg font-medium text-white">
            <span>Total</span>
            <span className="text-[#E6C068]">
              ${(order.totalCents / 100).toFixed(2)}
            </span>
          </div>
          <div className="mt-6 border-t border-white/10 pt-6">
            <p className="mb-1 text-xs uppercase tracking-widest text-white/60">
              Ship to
            </p>
            <p className="text-sm text-white/80">
              {order.shippingFullName}
              <br />
              {order.shippingLine1}
              {order.shippingLine2 && (
                <>
                  <br />
                  {order.shippingLine2}
                </>
              )}
              <br />
              {order.shippingCity}, {order.shippingStateOrProvince}{" "}
              {order.shippingPostalCode}
              <br />
              {order.shippingCountry}
              {order.shippingPhone && (
                <>
                  <br />
                  {order.shippingPhone}
                </>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
