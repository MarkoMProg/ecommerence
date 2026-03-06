"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, ShoppingCart } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { useCartCount } from "@/lib/cart-count-context";

/** Text links shown in both desktop nav and mobile drawer (Cart handled separately). */
const textNavLinks = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
];

function CartIconButton() {
  const { count } = useCartCount();
  return (
    <Link
      href="/cart"
      className="relative flex h-9 w-9 items-center justify-center rounded-md text-white/90 transition-colors hover:bg-white/5 hover:text-white"
      aria-label={
        count > 0
          ? `Cart, ${count} item${count !== 1 ? "s" : ""}`
          : "Cart"
      }
    >
      <ShoppingCart className="size-5" />
      {count > 0 && (
        <span
          className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#FF4D00] px-[3px] text-[10px] font-bold leading-none text-white"
          aria-hidden="true"
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { session } = useAuth();
  const { count } = useCartCount();

  const accountLink = session?.user
    ? { href: "/account", label: "Account" }
    : { href: "/auth/login", label: "Login" };

  const allNavLinks = [...textNavLinks, accountLink];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#0A0A0A]/95 backdrop-blur">
      <div className="mx-auto flex h-14 min-h-[44px] max-w-[1400px] items-center justify-between px-4 sm:h-16 sm:px-6">
        <Link
          href="/"
          className="text-sm font-bold uppercase tracking-wider text-white transition-opacity hover:opacity-80 sm:text-base"
          style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
        >
          Darkloom
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 sm:flex sm:gap-8">
          {allNavLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-xs uppercase tracking-wider text-white/90 transition-colors hover:text-white sm:text-sm"
            >
              {link.label}
            </Link>
          ))}
          {/* Cart icon with badge — separate from text links */}
          <CartIconButton />
        </nav>

        {/* Mobile: cart icon + hamburger */}
        <div className="flex items-center gap-1 sm:hidden">
          <CartIconButton />
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex h-10 w-10 min-h-[44px] min-w-[44px] items-center justify-center text-white"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            {menuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </div>

      {/* Mobile nav drawer */}
      {menuOpen && (
        <nav
          className="border-t border-white/10 bg-[#0A0A0A] px-4 py-4 sm:hidden"
          aria-label="Mobile navigation"
        >
          <ul className="flex flex-col gap-1">
            {allNavLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="block min-h-[44px] py-3 text-sm uppercase tracking-wider text-white/90 transition-colors hover:text-white"
                >
                  {link.label}
                </Link>
              </li>
            ))}
            {/* Cart row in mobile nav */}
            <li>
              <Link
                href="/cart"
                onClick={() => setMenuOpen(false)}
                className="flex min-h-[44px] items-center justify-between py-3 text-sm uppercase tracking-wider text-white/90 transition-colors hover:text-white"
              >
                <span>Cart</span>
                {count > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#FF4D00] px-1.5 text-[10px] font-bold text-white">
                    {count > 99 ? "99+" : count}
                  </span>
                )}
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
