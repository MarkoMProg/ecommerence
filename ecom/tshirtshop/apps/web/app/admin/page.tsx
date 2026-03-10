"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { fetchAdminOrders, type AdminOrder } from "@/lib/api/admin";

interface DashboardStats {
  totalUsers: number;
  totalOrders: number;
  recentOrders: AdminOrder[];
  revenue: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadStats() {
      try {
        // Use Better Auth admin plugin to list users
        const usersResult = await authClient.admin.listUsers({
          query: { limit: 1 },
        });
        const totalUsers = usersResult?.data?.total ?? 0;

        // Fetch orders from custom admin API
        const orders = await fetchAdminOrders();
        const totalOrders = orders?.length ?? 0;
        const recentOrders = (orders ?? []).slice(0, 5);
        const revenue = (orders ?? [])
          .filter((o) => o.status !== "cancelled" && o.status !== "refunded")
          .reduce((sum, o) => sum + o.totalCents, 0);

        if (!cancelled) {
          setStats({ totalUsers, totalOrders, recentOrders, revenue });
        }
      } catch {
        // Silently fail — dashboard will show loading state
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadStats();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <h1
        className="mb-8 text-2xl font-bold uppercase tracking-tight text-white sm:text-4xl"
        style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
      >
        Dashboard
      </h1>

      {loading ? (
        <p className="py-8 text-white/60">Loading dashboard...</p>
      ) : !stats ? (
        <p className="py-8 text-white/60">Unable to load dashboard data.</p>
      ) : (
        <>
          {/* Stats cards */}
          <div className="mb-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Total Users"
              value={String(stats.totalUsers)}
              href="/admin/users"
            />
            <StatCard
              label="Total Orders"
              value={String(stats.totalOrders)}
              href="/admin/orders"
            />
            <StatCard
              label="Revenue"
              value={`$${(stats.revenue / 100).toFixed(2)}`}
              accent
            />
            <StatCard
              label="Products"
              value="Manage"
              href="/admin/products"
            />
          </div>

          {/* Recent orders */}
          <div className="rounded-lg border border-white/10 bg-[#1A1A1A]">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <h2
                className="text-sm font-semibold uppercase tracking-wider text-white"
                style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
              >
                Recent Orders
              </h2>
              <Link
                href="/admin/orders"
                className="inline-flex items-center gap-1 text-xs text-[#FF4D00] hover:underline"
              >
                View All
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
            {stats.recentOrders.length === 0 ? (
              <p className="px-6 py-8 text-white/60">No orders yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-white/50">
                        Order
                      </th>
                      <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-white/50">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-white/50">
                        Status
                      </th>
                      <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-white/50">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {stats.recentOrders.map((order) => (
                      <tr key={order.id}>
                        <td className="px-6 py-3 font-mono text-white/80">
                          {order.id.slice(0, 8)}…
                        </td>
                        <td className="px-6 py-3 text-white/80">
                          {order.shippingFullName}
                        </td>
                        <td className="px-6 py-3">
                          <StatusBadge status={order.status} />
                        </td>
                        <td className="px-6 py-3 font-medium text-[#E6C068]">
                          ${(order.totalCents / 100).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}

function StatCard({
  label,
  value,
  href,
  accent,
}: {
  label: string;
  value: string;
  href?: string;
  accent?: boolean;
}) {
  const content = (
    <div className="rounded-lg border border-white/10 bg-[#1A1A1A] p-6 transition-colors hover:border-white/20">
      <p className="text-xs uppercase tracking-widest text-white/50">{label}</p>
      <p
        className={`mt-2 text-2xl font-bold ${accent ? "text-[#E6C068]" : "text-white"}`}
        style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
      >
        {value}
      </p>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: "bg-yellow-500/20 text-yellow-300",
    paid: "bg-blue-500/20 text-blue-300",
    shipped: "bg-purple-500/20 text-purple-300",
    completed: "bg-green-500/20 text-green-300",
    cancelled: "bg-red-500/20 text-red-300",
    refunded: "bg-gray-500/20 text-gray-300",
  };
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium uppercase ${colors[status] ?? "bg-white/10 text-white/60"}`}
    >
      {status}
    </span>
  );
}
