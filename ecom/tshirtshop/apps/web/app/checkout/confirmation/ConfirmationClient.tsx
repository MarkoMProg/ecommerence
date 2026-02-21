"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Order } from "@/lib/api/orders";
import { fetchOrder } from "@/lib/api/orders";
import { verifyPayment } from "@/lib/api/checkout";
import { CancelOrderButton } from "./CancelOrderButton";

interface ConfirmationClientProps {
  orderId: string;
  sessionId: string | null;
}

export function ConfirmationClient({ orderId, sessionId }: ConfirmationClientProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (sessionId) {
        try {
          const verified = await verifyPayment(sessionId, orderId);
          if (!cancelled) {
            setOrder(verified);
            setStatus("success");
          }
        } catch (e) {
          if (!cancelled) {
            setError(e instanceof Error ? e.message : "Failed to verify payment");
            setStatus("error");
          }
        }
      } else {
        const o = await fetchOrder(orderId);
        if (!cancelled) {
          setOrder(o ?? null);
          setStatus(o ? "success" : "error");
          if (!o) setError("Order not found");
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [orderId, sessionId]);

  if (status === "loading") {
    return (
      <div className="mx-auto max-w-[1400px] px-4 py-10 sm:px-6 sm:py-16">
        <div className="rounded-lg border border-white/10 bg-white/5 p-12 text-center">
          <p className="text-white/80">
            {sessionId ? "Verifying payment…" : "Loading order…"}
          </p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="mx-auto max-w-[1400px] px-4 py-10 sm:px-6 sm:py-16">
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-8 text-center">
          <p className="mb-4 text-red-200">{error ?? "Something went wrong"}</p>
          <Link
            href="/checkout"
            className="inline-flex min-h-[44px] items-center justify-center rounded-md bg-[#FF4D00] px-6 py-2 text-sm font-medium uppercase tracking-wider text-white"
          >
            Back to checkout
          </Link>
        </div>
      </div>
    );
  }

  if (!order) return null;

  const isPaid = order.status === "paid";

  return (
    <div className="space-y-8">
      <div className="rounded-lg border border-white/10 bg-white/5 p-8 text-center sm:p-12">
        <h1
          className="mb-4 text-2xl font-bold uppercase tracking-tight text-white sm:text-4xl"
          style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
        >
          Order Confirmed
        </h1>
        <p className="mb-6 text-white/80">
          {isPaid
            ? "Thank you for your order. Your payment has been received."
            : "Thank you for your order. Your order has been created and is pending payment."}
        </p>
        {orderId && (
          <p className="mb-6 font-mono text-sm text-white/60">Order ID: {orderId}</p>
        )}
        {orderId && order && (
          <CancelOrderButton orderId={orderId} status={order.status} />
        )}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/shop"
            className="inline-flex min-h-[44px] items-center justify-center rounded-md bg-[#FF4D00] px-6 py-2 text-sm font-medium uppercase tracking-wider text-white transition-colors hover:bg-[#FF4D00]/90"
          >
            Continue Shopping
          </Link>
          <Link
            href="/"
            className="inline-flex min-h-[44px] items-center justify-center rounded-md border border-white/20 px-6 py-2 text-sm font-medium uppercase tracking-wider text-white transition-colors hover:border-white/40"
          >
            Home
          </Link>
        </div>
      </div>

      {order.items.length > 0 && (
        <div className="rounded-lg border border-white/10 bg-white/5 p-6">
          {order.status === "cancelled" && (
            <p className="mb-6 rounded-md border border-amber-500/50 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
              This order has been cancelled.
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
