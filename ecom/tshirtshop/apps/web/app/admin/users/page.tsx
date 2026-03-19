"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { fetchAdminUsers, type AdminUser } from "@/lib/api/admin";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function formatDate(d: Date | string): string {
  try {
    const date = typeof d === "string" ? new Date(d) : d;
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return String(d);
  }
}

const PAGE_SIZE = 20;

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (newPage = 1, searchValue?: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchAdminUsers(newPage, PAGE_SIZE, searchValue);

      if (result) {
        setUsers(result.data);
        setTotal(result.pagination.total);
        setPage(newPage);
      } else {
        setError("Failed to load users");
      }
    } catch {
      setError("Failed to load users. Ensure you have admin access.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(0);
  }, [load]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    load(1, search);
  };

  const currentPage = page;
  const totalPages = Math.ceil(total / PAGE_SIZE);

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
            placeholder="Search by email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-48 bg-white/5 sm:w-64"
          />
          <Button
            type="submit"
            variant="outline"
            className="border-white/20 bg-white/5 text-white hover:bg-white/10"
          >
            Search
          </Button>
        </form>
      </div>

      {error && (
        <p className="mb-4 rounded border border-red-500/50 bg-red-500/10 px-4 py-2 text-sm text-red-200">
          {error}
        </p>
      )}

      {loading ? (
        <p className="py-8 text-white/60">Loading users...</p>
      ) : users.length === 0 ? (
        <p className="py-8 text-white/60">
          No users found{search.trim() ? " matching search" : ""}.
        </p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-white/10">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead className="border-b border-white/10 bg-white/5">
                <tr>
                  <th className="px-4 py-3 font-medium text-white">Name</th>
                  <th className="px-4 py-3 font-medium text-white">Email</th>
                  <th className="px-4 py-3 font-medium text-white">Role</th>
                  <th className="px-4 py-3 font-medium text-white">Status</th>
                  <th className="px-4 py-3 font-medium text-white">Verified</th>
                  <th className="px-4 py-3 font-medium text-white">2FA</th>
                  <th className="px-4 py-3 font-medium text-white">Joined</th>
                  <th className="px-4 py-3 font-medium text-white">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {users.map((u) => (
                  <tr key={u.id} className="bg-[#1A1A1A]/50">
                    <td className="px-4 py-3 font-medium text-white">
                      {u.name}
                    </td>
                    <td className="px-4 py-3 text-white/80">{u.email}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium uppercase ${
                          u.role === "admin"
                            ? "bg-[#FF4D00]/20 text-[#FF4D00]"
                            : "bg-white/10 text-white/60"
                        }`}
                      >
                        {u.role || "user"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {u.banned ? (
                        <span className="inline-block rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-medium uppercase text-red-300">
                          Banned
                        </span>
                      ) : (
                        <span className="inline-block rounded-full bg-green-500/20 px-2 py-0.5 text-xs font-medium uppercase text-green-300">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-white/80">
                      {u.emailVerified ? "Yes" : "No"}
                    </td>
                    <td className="px-4 py-3 text-white/80">
                      {u.twoFactorEnabled ? "Yes" : "—"}
                    </td>
                    <td className="px-4 py-3 text-white/80">
                      {formatDate(u.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/users/${u.id}`}
                        className="text-[#FF4D00] hover:underline"
                      >
                        Manage
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center gap-4 text-sm text-white/60">
              <span>
                Page {currentPage} of {totalPages} ({total} total)
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => load(currentPage - 1, search)}
                  disabled={currentPage <= 1}
                  className="border-white/20 disabled:opacity-50"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => load(currentPage + 1, search)}
                  disabled={currentPage >= totalPages}
                  className="border-white/20 disabled:opacity-50"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}
