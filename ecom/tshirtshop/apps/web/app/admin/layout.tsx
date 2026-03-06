"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  Package,
  Star,
  Lock,
  Menu,
  X,
  ArrowLeft,
} from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { checkAdminAccess } from "@/lib/api/admin";

const adminNavLinks = [
  { href: "/admin", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", Icon: Users },
  { href: "/admin/orders", label: "Orders", Icon: ShoppingCart },
  { href: "/admin/products", label: "Products", Icon: Package },
  { href: "/admin/reviews", label: "Reviews", Icon: Star },
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
      router.replace("/auth/login?redirect=/admin");
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
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <div className="h-8 w-8 animate-pulse rounded-full border-2 border-[#FF4D00]/30 border-t-[#FF4D00]" />
        <p className="text-sm uppercase tracking-wider text-white/60">
          Verifying admin access…
        </p>
      </div>
    );
  }

  // 2FA enforcement screen
  if (needs2FA) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="w-full max-w-md rounded-lg border border-[#FF4D00]/30 bg-[#1A1A1A] p-8 text-center">
          <div className="mb-4 flex justify-center">
            <Lock className="h-12 w-12 text-[#FF4D00]/30" />
          </div>
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
            className="mt-3 flex items-center justify-center gap-2 text-xs text-white/40 transition-colors hover:text-white/60"
          >
            <ArrowLeft className="size-3.5" />
            Back to Store
          </Link>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#0A0A0A]">
      {/* Admin top bar */}
      <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-white/10 bg-[#0A0A0A]/95 px-4 backdrop-blur sm:h-16 sm:px-6">
        {/* Left: logo */}
        <Link
          href="/"
          className="text-sm font-bold uppercase tracking-wider text-white transition-opacity hover:opacity-80 sm:text-base"
          style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
        >
          Darkloom
        </Link>

        {/* Center: admin label (desktop only) */}
        <span className="hidden text-xs font-bold uppercase tracking-[0.2em] text-[#FF4D00] lg:block">
          Admin Panel
        </span>

        {/* Right: back to store + mobile sidebar toggle */}
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="hidden items-center gap-2 text-xs text-white/50 transition-colors hover:text-white sm:flex"
          >
            <ArrowLeft className="size-3.5" />
            Back to Store
          </Link>
          {/* Mobile: open admin sidebar */}
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="flex h-10 w-10 items-center justify-center text-white lg:hidden"
            aria-label={sidebarOpen ? "Close admin menu" : "Open admin menu"}
            aria-expanded={sidebarOpen}
          >
            {sidebarOpen ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </header>

      {/* Below header: sidebar + content */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <aside
          className={`
            fixed inset-y-0 left-0 z-40 w-64 transform border-r border-white/10 bg-[#0A0A0A] pt-14 transition-transform duration-200
            lg:relative lg:inset-auto lg:z-auto lg:w-56 lg:translate-x-0 lg:pt-0 xl:w-64
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          `}
        >
          <div className="flex h-full flex-col">
            {/* Admin info (shown in sidebar on desktop; top bar handles it on mobile) */}
            <div className="border-b border-white/10 px-6 py-5">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#FF4D00]">
                Admin Panel
              </p>
              <p className="mt-1 truncate text-xs text-white/40">
                {session?.user?.email}
              </p>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4">
              <ul className="space-y-1">
                {adminNavLinks.map((nav) => {
                  const isActive =
                    nav.href === "/admin"
                      ? pathname === "/admin"
                      : pathname.startsWith(nav.href);
                  const Icon = nav.Icon;
                  return (
                    <li key={nav.href}>
                      <Link
                        href={nav.href}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors ${
                          isActive
                            ? "bg-white/10 text-white"
                            : "text-white/60 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        <Icon className="size-4 shrink-0" />
                        <span className="uppercase tracking-wider">
                          {nav.label}
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
                className="flex items-center gap-2 text-xs text-white/40 transition-colors hover:text-white/60"
              >
                <ArrowLeft className="size-3.5" />
                Back to Store
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
        <main className="flex-1 min-w-0 px-4 py-8 sm:px-8 lg:px-12">{children}</main>
      </div>
    </div>
  );
}
