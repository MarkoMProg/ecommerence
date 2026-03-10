"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ShoppingBag, User, Search } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { useCart } from "@/lib/cart-count-context";
import { SearchModal } from "@/components/search-modal";

const DESKTOP_NAV = [
  { href: "/shop", label: "Shop" },
  { href: "/shop?category=t-shirts", label: "T-Shirts" },
  { href: "/shop?category=hoodies", label: "Hoodies" },
  { href: "/shop?category=accessories", label: "Accessories" },
];

const DRAWER_NAV = [
  { href: "/shop", label: "All Products" },
  { href: "/shop?category=t-shirts", label: "T-Shirts" },
  { href: "/shop?category=hoodies", label: "Hoodies" },
  { href: "/shop?category=hats", label: "Hats" },
  { href: "/shop?category=accessories", label: "Accessories" },
];

function CartButton() {
  const { count, badgePop, openDrawer } = useCart();
  return (
    <button
      type="button"
      onClick={openDrawer}
      className="relative flex h-10 w-10 items-center justify-center text-white/55 transition-colors duration-200 hover:text-white"
      aria-label={
        count > 0 ? `Cart, ${count} item${count !== 1 ? "s" : ""}` : "Cart, empty"
      }
    >
      <ShoppingBag className="size-[18px]" strokeWidth={1.5} />
      {count > 0 && (
        <span
          key={badgePop}
          className={`absolute right-0.5 top-0.5 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-[#FF4D00] px-[3px] text-[9px] font-bold leading-none text-white${badgePop > 0 ? " badge-pop" : ""}`}
          aria-hidden="true"
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
}

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { session } = useAuth();
  const { count, openDrawer } = useCart();
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close drawer on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Lock body scroll while drawer is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const accountHref = session?.user ? "/account" : "/auth/login";

  return (
    <>
      <header
        className={[
          "sticky top-0 z-50 w-full transition-all duration-300",
          scrolled
            ? "bg-[#0A0A0A]/98 shadow-[0_1px_0_rgba(255,255,255,0.05),0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-md"
            : "border-b border-white/[0.06] bg-[#0A0A0A]/95 backdrop-blur-sm",
        ].join(" ")}
      >
        {/* ── Desktop layout (lg+) ───────────────────────────── */}
        <div
          className={[
            "mx-auto hidden max-w-[1400px] items-center px-10 transition-[height] duration-300 lg:flex",
            scrolled ? "h-[60px]" : "h-[72px]",
          ].join(" ")}
        >
          {/* Left: Logo */}
          <div className="flex flex-1">
            <Link
              href="/"
              className="font-bold uppercase text-white transition-opacity duration-200 hover:opacity-60"
              style={{
                fontFamily: "var(--font-space-grotesk), sans-serif",
                fontSize: "15px",
                letterSpacing: "0.2em",
              }}
            >
              Darkloom
            </Link>
          </div>

          {/* Center: Primary navigation */}
          <nav aria-label="Primary navigation" className="flex items-center gap-9">
            {DESKTOP_NAV.map((link) => {
              // Only exact-path links get the active indicator (category links share /shop as pathname)
              const isActive = !link.href.includes("?") && pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={[
                    "group relative py-1 text-[11px] uppercase transition-colors duration-200",
                    isActive ? "text-white" : "text-white/50 hover:text-white",
                  ].join(" ")}
                  style={{ letterSpacing: "0.14em" }}
                >
                  {link.label}
                  {/* Underline slide-in animation */}
                  <span
                    className={[
                      "absolute bottom-0 left-0 h-px w-full origin-left bg-white transition-transform duration-300",
                      isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100",
                    ].join(" ")}
                    aria-hidden="true"
                  />
                </Link>
              );
            })}
          </nav>

          {/* Right: Utility icons */}
          <div className="flex flex-1 items-center justify-end gap-0.5">
            <button
              type="button"
              aria-label="Search products"
              onClick={() => setSearchOpen(true)}
              className="flex h-10 w-10 items-center justify-center text-white/55 transition-colors duration-200 hover:text-white"
            >
              <Search className="size-[18px]" strokeWidth={1.5} />
            </button>

            <Link
              href={accountHref}
              aria-label={session?.user ? "My account" : "Sign in"}
              className="flex h-10 w-10 items-center justify-center text-white/55 transition-colors duration-200 hover:text-white"
            >
              <User className="size-[18px]" strokeWidth={1.5} />
            </Link>

            <CartButton />
          </div>
        </div>

        {/* ── Mobile layout (< lg) ───────────────────────────── */}
        <div className="relative flex h-[60px] items-center px-4 lg:hidden">
          {/* Left: Hamburger */}
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center text-white/70 transition-colors hover:text-white"
            aria-expanded={menuOpen}
            aria-label="Open navigation menu"
          >
            <Menu className="size-5" strokeWidth={1.5} />
          </button>

          {/* Center: Logo — absolutely centered so it's independent of icon widths */}
          <Link
            href="/"
            className="absolute left-1/2 -translate-x-1/2 font-bold uppercase text-white transition-opacity hover:opacity-70"
            style={{
              fontFamily: "var(--font-space-grotesk), sans-serif",
              fontSize: "13px",
              letterSpacing: "0.2em",
              whiteSpace: "nowrap",
            }}
          >
            Darkloom
          </Link>

          {/* Right: Cart */}
          <div className="ml-auto">
            <CartButton />
          </div>
        </div>
      </header>

      {/* ── Drawer backdrop ─────────────────────────────────── */}
      <div
        className={[
          "fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition-opacity duration-300 lg:hidden",
          menuOpen ? "opacity-100" : "pointer-events-none opacity-0",
        ].join(" ")}
        aria-hidden="true"
        onClick={() => setMenuOpen(false)}
      />

      {/* ── Search modal ────────────────────────────────────── */}
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* ── Mobile navigation drawer ────────────────────────── */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className={[
          "fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col bg-[#0D0D0D] transition-transform duration-300 ease-in-out lg:hidden",
          menuOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        {/* Drawer header */}
        <div className="flex h-[60px] shrink-0 items-center justify-between border-b border-white/[0.07] px-5">
          <Link
            href="/"
            onClick={() => setMenuOpen(false)}
            className="font-bold uppercase text-white"
            style={{
              fontFamily: "var(--font-space-grotesk), sans-serif",
              fontSize: "13px",
              letterSpacing: "0.2em",
            }}
          >
            Darkloom
          </Link>
          <button
            type="button"
            onClick={() => setMenuOpen(false)}
            className="flex h-9 w-9 items-center justify-center text-white/50 transition-colors hover:text-white"
            aria-label="Close navigation menu"
          >
            <X className="size-5" strokeWidth={1.5} />
          </button>
        </div>

        {/* Drawer nav */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          <p
            className="mb-2 text-[10px] uppercase text-white/30"
            style={{ letterSpacing: "0.14em" }}
          >
            Shop
          </p>
          <ul className="border-b border-white/[0.07] pb-5">
            {DRAWER_NAV.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="flex min-h-[44px] items-center text-[13px] uppercase text-white/60 transition-colors hover:text-white"
                  style={{ letterSpacing: "0.1em" }}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <ul className="mt-4">
            <li>
              <Link
                href={accountHref}
                onClick={() => setMenuOpen(false)}
                className="flex min-h-[44px] items-center gap-3 text-[13px] uppercase text-white/60 transition-colors hover:text-white"
                style={{ letterSpacing: "0.1em" }}
              >
                <User className="size-[15px] shrink-0" strokeWidth={1.5} />
                {session?.user ? "Account" : "Sign In"}
              </Link>
            </li>
            <li>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  openDrawer();
                }}
                className="flex min-h-[44px] w-full items-center justify-between text-[13px] uppercase text-white/60 transition-colors hover:text-white"
                style={{ letterSpacing: "0.1em" }}
              >
                <span className="flex items-center gap-3">
                  <ShoppingBag className="size-[15px] shrink-0" strokeWidth={1.5} />
                  Cart
                </span>
                {count > 0 && (
                  <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#FF4D00] px-[5px] text-[9px] font-bold text-white">
                    {count > 99 ? "99+" : count}
                  </span>
                )}
              </button>
            </li>
          </ul>
        </div>
      </div>
    </>
  );
}
