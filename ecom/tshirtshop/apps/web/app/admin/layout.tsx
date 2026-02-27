"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { checkAdminAccess } from "@/lib/api/admin";

const adminNavLinks = [
  { href: "/admin", label: "Dashboard", icon: "◆" },
  { href: "/admin/users", label: "Users", icon: "◇" },
  { href: "/admin/orders", label: "Orders", icon: "▦" },
  { href: "/admin/products", label: "Products", icon: "▣" },
  { href: "/admin/reviews", label: "Reviews", icon: "★" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { session, isLoading } = useAuth();
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [needs2FA, setNeeds2FA] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    if (!session?.user) {
      router.replace("/auth/login");
      return;
    }

    // Verify admin role via Better Auth admin plugin session role
    const userRole = (session.user as any).role;
    if (userRole !== "admin") {
      // Fallback: check admin access via custom endpoint
      checkAdminAccess().then((ok) => {
        if (!ok) {
          router.replace("/");
        } else {
          setAuthorized(true);
        }
      });
      return;
    }

    // Enforce 2FA for admin access
    const twoFactorEnabled = (session.user as any).twoFactorEnabled;
    if (!twoFactorEnabled) {
      setNeeds2FA(true);
      setAuthorized(false);
      return;
    }

    setAuthorized(true);
  }, [session, isLoading, router]);

  if (isLoading || (authorized === null && !needs2FA)) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-white/60">Verifying admin access...</p>
      </div>
    );
  }

  // 2FA enforcement screen
  if (needs2FA) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="w-full max-w-md rounded-lg border border-[#FF4D00]/30 bg-[#1A1A1A] p-8 text-center">
          <div className="mb-4 text-4xl">🔐</div>
          <h2
            className="mb-2 text-xl font-bold uppercase tracking-tight text-white"
            style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
          >
            Two-Factor Authentication Required
          </h2>
          <p className="mb-6 text-sm text-white/60">
            All admin accounts must have two-factor authentication enabled.
            Please enable 2FA in your account settings to access the admin
            panel.
          </p>
          <Link
            href="/account"
            className="inline-block rounded-md bg-[#FF4D00] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#FF4D00]/80"
          >
            Go to Account Settings
          </Link>
          <Link
            href="/"
            className="mt-3 block text-xs text-white/40 transition-colors hover:text-white/60"
          >
            ← Back to Store
          </Link>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return null;
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Mobile sidebar toggle */}
      <button
        type="button"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed bottom-4 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-[#FF4D00] text-white shadow-lg lg:hidden"
        aria-label="Toggle admin menu"
      >
        {sidebarOpen ? "×" : "☰"}
      </button>

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 w-64 transform border-r border-white/10 bg-[#0A0A0A] pt-16 transition-transform duration-200
          lg:relative lg:inset-auto lg:z-auto lg:translate-x-0 lg:pt-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex h-full flex-col">
          {/* Admin header */}
          <div className="border-b border-white/10 px-6 py-5">
            <h2
              className="text-xs font-bold uppercase tracking-[0.2em] text-[#FF4D00]"
              style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
            >
              Admin Panel
            </h2>
            <p className="mt-1 text-xs text-white/40">
              {session?.user?.email}
            </p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4">
            <ul className="space-y-1">
              {adminNavLinks.map((link) => {
                const isActive =
                  link.href === "/admin"
                    ? pathname === "/admin"
                    : pathname.startsWith(link.href);
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors ${
                        isActive
                          ? "bg-white/10 text-white"
                          : "text-white/60 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <span className="text-base">{link.icon}</span>
                      <span className="uppercase tracking-wider">
                        {link.label}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Footer */}
          <div className="border-t border-white/10 px-6 py-4">
            <Link
              href="/"
              className="text-xs text-white/40 transition-colors hover:text-white/60"
            >
              ← Back to Store
            </Link>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="flex-1 px-4 py-8 sm:px-8 lg:px-12">{children}</main>
    </div>
  );
}
