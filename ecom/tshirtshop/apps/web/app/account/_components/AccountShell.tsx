"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  MapPin,
  CreditCard,
  User2,
  ShieldCheck,
  Menu,
  X,
  LogOut,
  ArrowLeft,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/components/auth-provider";

const accountNavLinks = [
  {
    href: "/account",
    label: "Overview",
    Icon: LayoutDashboard,
    exact: true,
  },
  { href: "/account/orders", label: "Orders", Icon: ShoppingBag },
  { href: "/account/addresses", label: "Addresses", Icon: MapPin },
  {
    href: "/account/payment-methods",
    label: "Payment Methods",
    Icon: CreditCard,
  },
  { href: "/account/profile", label: "Profile", Icon: User2 },
  { href: "/account/security", label: "Security", Icon: ShieldCheck },
] as const;

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

function getCurrentLabel(pathname: string): string {
  const match = [...accountNavLinks]
    .reverse()
    .find((n) =>
      n.exact ? pathname === n.href : pathname.startsWith(n.href),
    );
  return match?.label ?? "Account";
}

export function AccountShell({ children }: { children: React.ReactNode }) {
  const { session, isLoading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !session?.user) {
      router.replace(
        `/auth/login?redirect=${encodeURIComponent(pathname)}`,
      );
    }
  }, [session, isLoading, router, pathname]);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  if (isLoading || !session?.user) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#FF4D00]/30 border-t-[#FF4D00]" />
        <p className="text-xs uppercase tracking-widest text-white/40">
          Loading…
        </p>
      </div>
    );
  }

  const user = session.user;
  const initials = getInitials(user.name || user.email);
  const currentLabel = getCurrentLabel(pathname);

  return (
    <div className="flex min-h-screen flex-col bg-[#0A0A0A]">
      {/* ── Mobile top bar ── */}
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-white/10 bg-[#0A0A0A]/95 px-4 backdrop-blur-sm lg:hidden">
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-md text-white/60 hover:bg-white/5 hover:text-white"
          aria-label="Open account menu"
        >
          <Menu className="size-5" />
        </button>
        <span
          className="text-sm font-bold uppercase tracking-tight text-white"
          style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
        >
          {currentLabel}
        </span>
      </header>

      <div className="mx-auto flex w-full max-w-[1200px] flex-1 gap-0 lg:gap-8 lg:px-8 lg:py-10">
        {/* ── Sidebar ── */}
        <aside
          className={`
            fixed inset-y-0 left-0 z-40 w-64 transform border-r border-white/10 bg-[#0A0A0A]
            transition-transform duration-200
            lg:relative lg:inset-auto lg:z-auto lg:block lg:w-56 lg:translate-x-0 lg:shrink-0 lg:border-r-0 xl:w-60
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          `}
        >
          <div className="flex h-full flex-col pt-4 lg:pt-0">
            {/* Mobile sidebar header */}
            <div className="flex items-center justify-between border-b border-white/10 px-4 pb-4 lg:hidden">
              <span
                className="text-sm font-bold uppercase tracking-tight text-white"
                style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
              >
                Account
              </span>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-md text-white/60 hover:text-white"
                aria-label="Close menu"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* User summary */}
            <div className="border-b border-white/10 px-4 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FF4D00] text-[11px] font-bold text-white">
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-white">
                    {user.name || "Account"}
                  </p>
                  <p className="truncate text-[10px] text-white/40">
                    {user.email}
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-3 py-4">
              <ul className="space-y-0.5">
                {accountNavLinks.map((nav) => {
                  const isActive = nav.exact
                    ? pathname === nav.href
                    : pathname.startsWith(nav.href);
                  const Icon = nav.Icon;
                  return (
                    <li key={nav.href}>
                      <Link
                        href={nav.href}
                        className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors ${
                          isActive
                            ? "bg-white/10 text-white"
                            : "text-white/55 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        <Icon className="size-4 shrink-0" />
                        <span className="text-[11px] uppercase tracking-wider">
                          {nav.label}
                        </span>
                        {isActive && (
                          <ChevronRight className="ml-auto size-3 text-white/30" />
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* Footer: sign out + back to store */}
            <div className="space-y-1 border-t border-white/10 px-3 py-4">
              <button
                type="button"
                onClick={() => signOut()}
                className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm text-red-400/80 transition-colors hover:bg-red-500/10 hover:text-red-400"
              >
                <LogOut className="size-4 shrink-0" />
                <span className="text-[11px] uppercase tracking-wider">
                  Sign Out
                </span>
              </button>
              <Link
                href="/shop"
                className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-white/40 transition-colors hover:bg-white/5 hover:text-white/70"
              >
                <ArrowLeft className="size-4 shrink-0" />
                <span className="text-[11px] uppercase tracking-wider">
                  Continue Shopping
                </span>
              </Link>
            </div>
          </div>
        </aside>

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ── Main content ── */}
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-0 lg:py-0">
          {children}
        </main>
      </div>
    </div>
  );
}
