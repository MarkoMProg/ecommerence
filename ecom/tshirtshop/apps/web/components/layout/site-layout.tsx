"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { Header } from "./header";
import { Footer } from "./footer";
import { useAuth } from "@/components/auth-provider";
import { CartCountProvider } from "@/lib/cart-count-context";

/** Pages that are part of the auth flow — guard must never redirect here to avoid loops */
const AUTH_PATHS = [
  "/auth/login",
  "/auth/callback",
  "/auth/two-factor",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/verify-email",
];

/**
 * Enforces 2FA verification globally.
 * If the user has 2FA enabled but has not completed verification in this browser
 * session (tracked via sessionStorage), redirect to the verify page.
 * This catches users who bypass the callback page by navigating directly.
 */
function TwoFactorGuard() {
  const { session, isLoading } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;
    if (!session?.user) return;

    const onAuthPage = AUTH_PATHS.some((p) => pathname.startsWith(p));
    if (onAuthPage) return;

    const twoFactorEnabled = (session.user as any).twoFactorEnabled;
    if (!twoFactorEnabled) return;

    const verified = sessionStorage.getItem("2fa_verified") === "true";
    if (!verified) {
      window.location.replace(`/auth/two-factor/verify?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [session, isLoading, pathname]);

  return null;
}

export function SiteLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  if (isAdmin) {
    return (
      <>
        <TwoFactorGuard />
        {children}
      </>
    );
  }

  return (
    <CartCountProvider>
      <div className="flex min-h-screen flex-col">
        <TwoFactorGuard />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </CartCountProvider>
  );
}
