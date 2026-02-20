"use client";

import { useState } from "react";
import Link from "next/link";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/cart", label: "Cart" },
  { href: "/account", label: "Account" },
  { href: "/admin", label: "Admin" },
];

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

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
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-xs uppercase tracking-wider text-white/90 transition-colors hover:text-white sm:text-sm"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        {/* Mobile menu button */}
        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex h-10 w-10 min-w-[44px] min-h-[44px] items-center justify-center text-white sm:hidden"
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
        >
          {menuOpen ? (
            <span className="text-xl">×</span>
          ) : (
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>
      {/* Mobile nav overlay */}
      {menuOpen && (
        <nav
          className="border-t border-white/10 bg-[#0A0A0A] px-4 py-4 sm:hidden"
          aria-label="Mobile navigation"
        >
          <ul className="flex flex-col gap-1">
            {navLinks.map((link) => (
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
          </ul>
        </nav>
      )}
    </header>
  );
}
