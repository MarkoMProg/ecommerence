"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { fetchAdminOrders } from "@/lib/api/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Better Auth admin plugin user type.
 */
interface BAUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
  role?: string | null;
  banned?: boolean | null;
  banReason?: string | null;
  banExpires?: number | null;
  twoFactorEnabled?: boolean | null;
  createdAt: Date;
  updatedAt: Date;
}

interface UserOrder {
  id: string;
  status: string;
  totalCents: number;
  createdAt: string;
}

function formatDate(d: Date | string): string {
  try {
    const date = typeof d === "string" ? new Date(d) : d;
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(d);
  }
}

const ROLE_OPTIONS = ["user", "admin"] as const;

export default function AdminUserDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [user, setUser] = useState<BAUser | null | undefined>(undefined);
  const [userOrders, setUserOrders] = useState<UserOrder[] | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [banReason, setBanReason] = useState("");
  const [banDuration, setBanDuration] = useState("");

  // Load user via Better Auth admin plugin
  const loadUser = async () => {
    try {
      const result = await authClient.admin.listUsers({
        query: {
          limit: 1,
          filterField: "id",
          filterValue: id,
          filterOperator: "eq" as const,
        },
      });

      if (result?.data?.users?.[0]) {
        setUser(result.data.users[0] as unknown as BAUser);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    if (!id) return;
    loadUser();
  }, [id]);

  // Load user orders
  useEffect(() => {
    if (!user) return;
    fetchAdminOrders().then((orders) => {
      if (orders) {
        const filtered = orders
          .filter((o) => o.userId === user.id)
          .map((o) => ({
            id: o.id,
            status: o.status,
            totalCents: o.totalCents,
            createdAt: o.createdAt,
          }));
        setUserOrders(filtered);
      }
    });
  }, [user?.id]);

  const clearMessages = () => {
    setActionError(null);
    setActionSuccess(null);
  };

  /**
   * Set user role using Better Auth admin plugin.
   */
  const handleSetRole = async (newRole: string) => {
    if (!user) return;
    clearMessages();
    setActionLoading("role");
    try {
      const result = await authClient.admin.setRole({
        userId: user.id,
        role: newRole as "user" | "admin",
      });
      if (result?.error) {
        setActionError(result.error.message || "Failed to set role");
      } else {
        setActionSuccess(`Role updated to "${newRole}"`);
        await loadUser();
      }
    } catch {
      setActionError("Failed to set role");
    } finally {
      setActionLoading(null);
    }
  };

  /**
   * Ban user using Better Auth admin plugin.
   */
  const handleBanUser = async () => {
    if (!user) return;
    clearMessages();
    setActionLoading("ban");
    try {
      const banOpts: { userId: string; banReason?: string; banExpiresIn?: number } = {
        userId: user.id,
      };
      if (banReason.trim()) {
        banOpts.banReason = banReason.trim();
      }
      if (banDuration.trim()) {
        const seconds = parseInt(banDuration.trim(), 10);
        if (!isNaN(seconds) && seconds > 0) {
          banOpts.banExpiresIn = seconds;
        }
      }

      const result = await authClient.admin.banUser(banOpts);
      if (result?.error) {
        setActionError(result.error.message || "Failed to ban user");
      } else {
        setActionSuccess("User has been banned");
        setBanReason("");
        setBanDuration("");
        await loadUser();
      }
    } catch {
      setActionError("Failed to ban user");
    } finally {
      setActionLoading(null);
    }
  };

  /**
   * Unban user using Better Auth admin plugin.
   */
  const handleUnbanUser = async () => {
    if (!user) return;
    clearMessages();
    setActionLoading("unban");
    try {
      const result = await authClient.admin.unbanUser({ userId: user.id });
      if (result?.error) {
        setActionError(result.error.message || "Failed to unban user");
      } else {
        setActionSuccess("User has been unbanned");
        await loadUser();
      }
    } catch {
      setActionError("Failed to unban user");
    } finally {
      setActionLoading(null);
    }
  };

  /**
   * Revoke all sessions for user using Better Auth admin plugin.
   */
  const handleRevokeSessions = async () => {
    if (!user) return;
    if (!confirm("Revoke all sessions for this user? They will be logged out everywhere.")) return;
    clearMessages();
    setActionLoading("revoke");
    try {
      const result = await authClient.admin.revokeUserSessions({
        userId: user.id,
      });
      if (result?.error) {
        setActionError(result.error.message || "Failed to revoke sessions");
      } else {
        setActionSuccess("All sessions revoked");
      }
    } catch {
      setActionError("Failed to revoke sessions");
    } finally {
      setActionLoading(null);
    }
  };

  /**
   * Remove user using Better Auth admin plugin.
   */
  const handleRemoveUser = async () => {
    if (!user) return;
    if (!confirm(`Permanently delete user "${user.name}" (${user.email})? This cannot be undone.`)) return;
    clearMessages();
    setActionLoading("remove");
    try {
      const result = await authClient.admin.removeUser({ userId: user.id });
      if (result?.error) {
        setActionError(result.error.message || "Failed to remove user");
      } else {
        setActionSuccess("User removed. Redirecting...");
        setTimeout(() => {
          window.location.href = "/admin/users";
        }, 1500);
      }
    } catch {
      setActionError("Failed to remove user");
    } finally {
      setActionLoading(null);
    }
  };

  if (user === undefined) {
    return <p className="py-8 text-white/60">Loading...</p>;
  }

  if (user === null) {
    return (
      <div className="py-8">
        <p className="text-white/60">User not found.</p>
        <Link
          href="/admin/users"
          className="mt-4 inline-block text-[#FF4D00] hover:underline"
        >
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
          className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white"
        >
          <ArrowLeft className="size-4" />
          Back to Users
        </Link>
      </div>

      <h1
        className="mb-8 text-2xl font-bold uppercase tracking-tight text-white sm:text-4xl"
        style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
      >
        User Details
      </h1>

      {/* Status messages */}
      {actionError && (
        <div className="mb-4 rounded border border-red-500/50 bg-red-500/10 px-4 py-2 text-sm text-red-200">
          {actionError}
        </div>
      )}
      {actionSuccess && (
        <div className="mb-4 rounded border border-green-500/50 bg-green-500/10 px-4 py-2 text-sm text-green-200">
          {actionSuccess}
        </div>
      )}

      {/* User info card */}
      <div className="mb-8 rounded-lg border border-white/10 bg-[#1A1A1A] p-6">
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
              Role
            </dt>
            <dd className="mt-1">
              <span
                className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium uppercase ${
                  user.role === "admin"
                    ? "bg-[#FF4D00]/20 text-[#FF4D00]"
                    : "bg-white/10 text-white/60"
                }`}
              >
                {user.role || "user"}
              </span>
            </dd>
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
              Status
            </dt>
            <dd className="mt-1">
              {user.banned ? (
                <span className="inline-block rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-medium uppercase text-red-300">
                  Banned
                  {user.banReason ? ` — ${user.banReason}` : ""}
                </span>
              ) : (
                <span className="inline-block rounded-full bg-green-500/20 px-2 py-0.5 text-xs font-medium uppercase text-green-300">
                  Active
                </span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-widest text-white/50">
              Joined
            </dt>
            <dd className="mt-1 text-white">{formatDate(user.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-widest text-white/50">
              Last Updated
            </dt>
            <dd className="mt-1 text-white">{formatDate(user.updatedAt)}</dd>
          </div>
        </dl>
      </div>

      {/* Admin Actions */}
      <div className="mb-12 grid gap-6 lg:grid-cols-2">
        {/* Role Management */}
        <div className="rounded-lg border border-white/10 bg-[#1A1A1A] p-6">
          <h2
            className="mb-4 text-sm font-semibold uppercase tracking-wider text-white"
            style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
          >
            Role Management
          </h2>
          <p className="mb-4 text-xs text-white/50">
            Change the user&apos;s role. Admin users have full access to the admin dashboard.
          </p>
          <div className="flex flex-wrap gap-2">
            {ROLE_OPTIONS.map((role) => (
              <Button
                key={role}
                variant={user.role === role ? "default" : "outline"}
                size="sm"
                onClick={() => handleSetRole(role)}
                disabled={actionLoading === "role" || user.role === role}
                className={
                  user.role === role
                    ? "bg-[#FF4D00] text-white hover:bg-[#FF4D00]/80"
                    : "border-white/20"
                }
              >
                {actionLoading === "role" ? "Updating..." : role.toUpperCase()}
              </Button>
            ))}
          </div>
        </div>

        {/* Ban Management */}
        <div className="rounded-lg border border-white/10 bg-[#1A1A1A] p-6">
          <h2
            className="mb-4 text-sm font-semibold uppercase tracking-wider text-white"
            style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
          >
            Ban Management
          </h2>
          {user.banned ? (
            <>
              <p className="mb-4 text-xs text-white/50">
                This user is currently banned.
                {user.banReason ? ` Reason: ${user.banReason}` : ""}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleUnbanUser}
                disabled={actionLoading === "unban"}
                className="border-green-500/50 text-green-300 hover:bg-green-500/10"
              >
                {actionLoading === "unban" ? "Unbanning..." : "Unban User"}
              </Button>
            </>
          ) : (
            <>
              <div className="mb-3 space-y-2">
                <div>
                  <Label htmlFor="banReason" className="text-xs text-white/50">
                    Ban Reason (optional)
                  </Label>
                  <Input
                    id="banReason"
                    value={banReason}
                    onChange={(e) => setBanReason(e.target.value)}
                    placeholder="e.g. Spamming, abuse..."
                    className="mt-1 bg-white/5"
                  />
                </div>
                <div>
                  <Label
                    htmlFor="banDuration"
                    className="text-xs text-white/50"
                  >
                    Duration in seconds (optional, empty = permanent)
                  </Label>
                  <Input
                    id="banDuration"
                    type="number"
                    min="0"
                    value={banDuration}
                    onChange={(e) => setBanDuration(e.target.value)}
                    placeholder="e.g. 86400 (1 day)"
                    className="mt-1 bg-white/5"
                  />
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBanUser}
                disabled={actionLoading === "ban"}
                className="border-red-500/50 text-red-300 hover:bg-red-500/10"
              >
                {actionLoading === "ban" ? "Banning..." : "Ban User"}
              </Button>
            </>
          )}
        </div>

        {/* Session Management */}
        <div className="rounded-lg border border-white/10 bg-[#1A1A1A] p-6">
          <h2
            className="mb-4 text-sm font-semibold uppercase tracking-wider text-white"
            style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
          >
            Session Management
          </h2>
          <p className="mb-4 text-xs text-white/50">
            Revoke all active sessions. The user will be logged out from all devices.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRevokeSessions}
            disabled={actionLoading === "revoke"}
            className="border-yellow-500/50 text-yellow-300 hover:bg-yellow-500/10"
          >
            {actionLoading === "revoke"
              ? "Revoking..."
              : "Revoke All Sessions"}
          </Button>
        </div>

        {/* Danger Zone */}
        <div className="rounded-lg border border-red-500/20 bg-[#1A1A1A] p-6">
          <h2
            className="mb-4 text-sm font-semibold uppercase tracking-wider text-red-400"
            style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
          >
            Danger Zone
          </h2>
          <p className="mb-4 text-xs text-white/50">
            Permanently remove this user from the database. This action cannot be undone.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRemoveUser}
            disabled={actionLoading === "remove"}
            className="border-red-500/50 text-red-300 hover:bg-red-500/10"
          >
            {actionLoading === "remove" ? "Removing..." : "Remove User"}
          </Button>
        </div>
      </div>

      {/* User Orders */}
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
