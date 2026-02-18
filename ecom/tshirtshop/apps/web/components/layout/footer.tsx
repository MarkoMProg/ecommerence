import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#0A0A0A]">
      <div className="mx-auto max-w-[1400px] px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid gap-10 sm:gap-12 md:grid-cols-4">
          <div>
            <Link
              href="/"
              className="font-bold uppercase tracking-wider text-white"
              style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
            >
              Darkloom
            </Link>
          </div>
          <div>
            <h4 className="mb-4 text-xs uppercase tracking-widest text-white/60">
              Shop
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/shop?category=t-shirts"
                  className="text-sm text-white/80 transition-colors hover:text-white"
                >
                  T-Shirts
                </Link>
              </li>
              <li>
                <Link
                  href="/shop?category=hoodies"
                  className="text-sm text-white/80 transition-colors hover:text-white"
                >
                  Hoodies
                </Link>
              </li>
              <li>
                <Link
                  href="/shop?category=hats"
                  className="text-sm text-white/80 transition-colors hover:text-white"
                >
                  Hats
                </Link>
              </li>
              <li>
                <Link
                  href="/shop?category=accessories"
                  className="text-sm text-white/80 transition-colors hover:text-white"
                >
                  Accessories
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 text-xs uppercase tracking-widest text-white/60">
              Account
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/auth/callback"
                  className="text-sm text-white/80 transition-colors hover:text-white"
                >
                  Sign In
                </Link>
              </li>
              <li>
                <Link
                  href="/auth/callback"
                  className="text-sm text-white/80 transition-colors hover:text-white"
                >
                  Cart
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 text-xs uppercase tracking-widest text-white/60">
              Newsletter
            </h4>
            <p className="mb-4 text-sm text-white/60">
              Drop announcements. No spam.
            </p>
            <form className="flex min-w-0 flex-col gap-2 sm:flex-row">
              <input
                type="email"
                placeholder="Email"
                className="min-h-[44px] flex-1 rounded-md border border-white/20 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/40 focus:border-[#FF4D00] focus:outline-none focus:ring-1 focus:ring-[#FF4D00]"
              />
              <button
                type="submit"
                className="min-h-[44px] shrink-0 rounded-md bg-[#FF4D00] px-4 py-2 text-sm font-medium uppercase tracking-wider text-white transition-colors hover:bg-[#FF4D00]/90"
              >
                Join
              </button>
            </form>
          </div>
        </div>
        <div className="mt-8 border-t border-white/10 pt-6 text-center text-[10px] uppercase tracking-widest text-white/40 sm:mt-12 sm:pt-8 sm:text-xs">
          © {new Date().getFullYear()} Darkloom. Elite tabletop culture.
        </div>
      </div>
    </footer>
  );
}
