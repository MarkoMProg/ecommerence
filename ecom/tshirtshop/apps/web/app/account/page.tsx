"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { fetchMyOrders } from "@/lib/api/orders";
import type { Order } from "@/lib/api/orders";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

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
    pending: "bg-amber-500/20 text-amber-200",
    paid: "bg-emerald-500/20 text-emerald-200",
    shipped: "bg-blue-500/20 text-blue-200",
    completed: "bg-white/10 text-white/80",
    cancelled: "bg-red-500/20 text-red-200",
  };
  return map[status] ?? "bg-white/10 text-white/60";
}

export default function AccountPage() {
  const { session, isLoading, signOut } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [ordersLoaded, setOrdersLoaded] = useState(false);

  useEffect(() => {
    if (session?.user) {
      let cancelled = false;
      fetchMyOrders().then((data) => {
        if (!cancelled) {
          setOrders(data ?? []);
          setOrdersLoaded(true);
        }
      });
      return () => {
        cancelled = true;
      };
    }
  }, [session?.user]);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="animate-pulse text-white/60">Loading...</div>
      </div>
    );
  }

  if (!session?.user) {
    router.replace("/auth/login?redirect=/account");
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="animate-pulse text-white/60">Redirecting...</div>
      </div>
    );
  }

  const user = session.user;

  return (
    <div className="mx-auto max-w-[900px] px-4 py-10 sm:px-6 sm:py-16">
      <nav className="mb-8 flex overflow-x-auto pb-1 text-[10px] uppercase tracking-widest text-white/60 sm:mb-12 sm:text-xs [scrollbar-width:none] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden">
        <Link href="/" className="hover:text-white">
          Home
        </Link>
        <span className="mx-2">/</span>
        <span className="text-white">Account</span>
      </nav>

      <h1
        className="mb-8 text-2xl font-bold uppercase tracking-tight text-white sm:text-4xl"
        style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
      >
        Account
      </h1>

      <div className="space-y-8">
        <Card className="border-white/10 bg-[#1A1A1A]">
          <CardHeader>
            <h2 className="text-lg font-semibold text-white">Profile</h2>
            <p className="text-sm text-white/60">
              {user.name || "No name"} · {user.email}
            </p>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button variant="secondary" asChild>
              <Link href="/auth/two-factor/setup">Two-Factor Authentication</Link>
            </Button>
            <Button variant="destructive" onClick={signOut}>
              Sign Out
            </Button>
            <Button variant="outline" asChild>
              <Link href="/">Continue Shopping</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-[#1A1A1A]">
          <CardHeader>
            <h2 className="text-lg font-semibold text-white">Order History</h2>
            <p className="text-sm text-white/60">
              View and manage your orders
            </p>
          </CardHeader>
          <CardContent>
            {!ordersLoaded ? (
              <p className="py-4 text-sm text-white/60">Loading orders...</p>
            ) : orders === null ? (
              <p className="py-4 text-sm text-white/60">
                Unable to load orders. Please try again later.
              </p>
            ) : orders.length === 0 ? (
              <p className="py-4 text-sm text-white/60">
                No orders yet.{" "}
                <Link href="/shop" className="text-[#FF4D00] hover:underline">
                  Start shopping
                </Link>
              </p>
            ) : (
              <ul className="divide-y divide-white/10">
                {orders.map((order) => (
                  <li key={order.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <Link
                          href={`/checkout/confirmation?orderId=${encodeURIComponent(order.id)}`}
                          className="font-mono text-sm text-white hover:underline"
                        >
                          {order.id}
                        </Link>
                        <p className="text-xs text-white/60">
                          {formatDate(order.createdAt)} · {order.items.length}{" "}
                          item{order.items.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded px-2 py-0.5 text-xs uppercase ${statusBadge(order.status)}`}
                        >
                          {order.status}
                        </span>
                        <span className="font-medium text-[#E6C068]">
                          ${(order.totalCents / 100).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
