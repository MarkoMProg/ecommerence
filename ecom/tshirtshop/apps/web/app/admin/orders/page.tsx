"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  fetchAdminOrders,
  adminUpdateOrderStatus,
  adminRefundOrder,
  type AdminOrder,
} from "@/lib/api/admin";
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

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [refunding, setRefunding] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchAdminOrders().then((data) => {
      if (!cancelled) {
        setOrders(data ?? []);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdating(orderId);
    const updated = await adminUpdateOrderStatus(orderId, newStatus);
    if (updated && orders) {
      setOrders(orders.map((o) => (o.id === orderId ? updated : o)));
    }
    setUpdating(null);
  };

  const handleRefund = async (orderId: string) => {
    if (!confirm("Refund this order? This cannot be undone.")) return;
    setRefunding(orderId);
    const updated = await adminRefundOrder(orderId);
    if (updated && orders) {
      setOrders(orders.map((o) => (o.id === orderId ? updated : o)));
    }
    setRefunding(null);
  };

  if (loading) {
    return (
      <p className="py-8 text-white/60">Loading orders...</p>
    );
  }

  if (orders === null) {
    return (
      <p className="py-8 text-white/60">
        Unable to load orders. Ensure ADMIN_EMAILS includes your email in backend .env
      </p>
    );
  }

  return (
    <>
      <h1
        className="mb-8 text-2xl font-bold uppercase tracking-tight text-white sm:text-4xl"
        style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
      >
        Orders
      </h1>
      {orders.length === 0 ? (
        <p className="py-8 text-white/60">No orders yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-white/10">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead className="border-b border-white/10 bg-white/5">
              <tr>
                <th className="px-4 py-3 font-medium text-white">Order</th>
                <th className="px-4 py-3 font-medium text-white">Date</th>
                <th className="px-4 py-3 font-medium text-white">Customer</th>
                <th className="px-4 py-3 font-medium text-white">Status</th>
                <th className="px-4 py-3 font-medium text-white">Total</th>
                <th className="px-4 py-3 font-medium text-white">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {orders.map((order) => (
                <tr key={order.id} className="bg-[#1A1A1A]/50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/checkout/confirmation?orderId=${encodeURIComponent(order.id)}`}
                      className="font-mono text-[#FF4D00] hover:underline"
                    >
                      {order.id.slice(0, 8)}…
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-white/80">{formatDate(order.createdAt)}</td>
                  <td className="px-4 py-3 text-white/80">{order.shippingFullName}</td>
                  <td className="px-4 py-3">
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      disabled={updating === order.id}
                      className="rounded border border-white/20 bg-white/5 px-2 py-1 text-white disabled:opacity-50 [color-scheme:dark]"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 font-medium text-[#E6C068]">
                    ${(order.totalCents / 100).toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    {REFUNDABLE_STATUSES.includes(order.status as (typeof REFUNDABLE_STATUSES)[number]) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRefund(order.id)}
                        disabled={refunding === order.id}
                      >
                        {refunding === order.id ? "Refunding…" : "Refund"}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
