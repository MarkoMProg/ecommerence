"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { fetchAdminUser, fetchAdminOrders, type AdminUserDetail } from "@/lib/api/admin";

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

export default function AdminUserDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [user, setUser] = useState<AdminUserDetail | null | undefined>(
    undefined
  );
  const [userOrders, setUserOrders] = useState<
    Awaited<ReturnType<typeof fetchAdminOrders>> | null
  >(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    fetchAdminUser(id).then((u) => {
      if (!cancelled) setUser(u ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!user) return;
    fetchAdminOrders().then((orders) => {
      if (orders) {
        const filtered = orders.filter((o) => o.userId === user.id);
        setUserOrders(filtered);
      }
    });
  }, [user?.id]);

  if (user === undefined) {
    return <p className="py-8 text-white/60">Loading...</p>;
  }

  if (user === null) {
    return (
      <div className="py-8">
        <p className="text-white/60">User not found.</p>
        <Link href="/admin/users" className="mt-4 inline-block text-[#FF4D00] hover:underline">
          Back to Users
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="mb-8">
        <Link
          href="/admin/users"
          className="text-sm text-white/60 hover:text-white"
        >
          ← Back to Users
        </Link>
      </div>
      <h1
        className="mb-8 text-2xl font-bold uppercase tracking-tight text-white sm:text-4xl"
        style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
      >
        User Details
      </h1>
      <div className="mb-12 rounded-lg border border-white/10 bg-[#1A1A1A] p-6">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-widest text-white/50">
              Name
            </dt>
            <dd className="mt-1 text-white">{user.name}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-widest text-white/50">
              Email
            </dt>
            <dd className="mt-1 text-white">{user.email}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-widest text-white/50">
              Email Verified
            </dt>
            <dd className="mt-1 text-white">
              {user.emailVerified ? "Yes" : "No"}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-widest text-white/50">
              2FA Enabled
            </dt>
            <dd className="mt-1 text-white">
              {user.twoFactorEnabled ? "Yes" : "No"}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-widest text-white/50">
              Order Count
            </dt>
            <dd className="mt-1 text-white">{user.orderCount}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-widest text-white/50">
              Joined
            </dt>
            <dd className="mt-1 text-white">{formatDate(user.createdAt)}</dd>
          </div>
        </dl>
      </div>
      <h2
        className="mb-4 text-lg font-semibold text-white"
        style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
      >
        Orders
      </h2>
      {userOrders === null ? (
        <p className="text-white/60">Loading orders...</p>
      ) : userOrders.length === 0 ? (
        <p className="text-white/60">No orders.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-white/10">
          <table className="w-full min-w-[500px] text-left text-sm">
            <thead className="border-b border-white/10 bg-white/5">
              <tr>
                <th className="px-4 py-3 font-medium text-white">Order</th>
                <th className="px-4 py-3 font-medium text-white">Date</th>
                <th className="px-4 py-3 font-medium text-white">Status</th>
                <th className="px-4 py-3 font-medium text-white">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {userOrders.map((o) => (
                <tr key={o.id} className="bg-[#1A1A1A]/50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/checkout/confirmation?orderId=${encodeURIComponent(o.id)}`}
                      className="font-mono text-[#FF4D00] hover:underline"
                    >
                      {o.id.slice(0, 8)}…
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-white/80">
                    {formatDate(o.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-white/80">{o.status}</td>
                  <td className="px-4 py-3 font-medium text-[#E6C068]">
                    ${(o.totalCents / 100).toFixed(2)}
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
