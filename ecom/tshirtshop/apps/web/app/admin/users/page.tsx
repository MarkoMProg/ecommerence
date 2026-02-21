"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchAdminUsers, type AdminUser } from "@/lib/api/admin";
import { Input } from "@/components/ui/input";

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

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
  });

  const load = (page = 1) => {
    setLoading(true);
    fetchAdminUsers({
      page,
      limit: 20,
      search: search.trim() || undefined,
    }).then((res) => {
      if (res) {
        setUsers(res.data);
        setPagination(res.pagination);
      } else {
        setUsers(null);
      }
      setLoading(false);
    });
  };

  useEffect(() => {
    load(1);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    load(1);
  };

  if (users === null && !loading) {
    return (
      <p className="py-8 text-white/60">
        Unable to load users. Ensure ADMIN_EMAILS includes your email in backend
        .env
      </p>
    );
  }

  return (
    <>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1
          className="text-2xl font-bold uppercase tracking-tight text-white sm:text-4xl"
          style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
        >
          Users
        </h1>
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            type="search"
            placeholder="Search by email or name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-48 bg-white/5 sm:w-64"
          />
          <button
            type="submit"
            className="rounded-md border border-white/20 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10"
          >
            Search
          </button>
        </form>
      </div>
      {loading ? (
        <p className="py-8 text-white/60">Loading users...</p>
      ) : users?.length === 0 ? (
        <p className="py-8 text-white/60">
          No users found{search.trim() ? " matching search" : ""}.
        </p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-white/10">
            <table className="w-full min-w-[500px] text-left text-sm">
              <thead className="border-b border-white/10 bg-white/5">
                <tr>
                  <th className="px-4 py-3 font-medium text-white">Name</th>
                  <th className="px-4 py-3 font-medium text-white">Email</th>
                  <th className="px-4 py-3 font-medium text-white">Verified</th>
                  <th className="px-4 py-3 font-medium text-white">2FA</th>
                  <th className="px-4 py-3 font-medium text-white">Orders</th>
                  <th className="px-4 py-3 font-medium text-white">Joined</th>
                  <th className="px-4 py-3 font-medium text-white">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {users?.map((u) => (
                  <tr key={u.id} className="bg-[#1A1A1A]/50">
                    <td className="px-4 py-3 font-medium text-white">{u.name}</td>
                    <td className="px-4 py-3 text-white/80">{u.email}</td>
                    <td className="px-4 py-3 text-white/80">
                      {u.emailVerified ? "Yes" : "No"}
                    </td>
                    <td className="px-4 py-3 text-white/80">
                      {u.twoFactorEnabled ? "Yes" : "—"}
                    </td>
                    <td className="px-4 py-3 text-white/80">{u.orderCount}</td>
                    <td className="px-4 py-3 text-white/80">
                      {formatDate(u.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/users/${u.id}`}
                        className="text-[#FF4D00] hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pagination.total > pagination.limit && (
            <div className="mt-4 flex items-center gap-4 text-sm text-white/60">
              <span>
                Page {pagination.page} of{" "}
                {Math.ceil(pagination.total / pagination.limit)}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => load(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="rounded border border-white/20 px-2 py-1 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => load(pagination.page + 1)}
                  disabled={
                    pagination.page >=
                    Math.ceil(pagination.total / pagination.limit)
                  }
                  className="rounded border border-white/20 px-2 py-1 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}
