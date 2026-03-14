import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About — Darkloom",
  description:
    "Darkloom: Elite tabletop culture meets high-fashion streetwear. Premium DnD apparel for adventurers who demand more.",
};

export default function AboutPage() {
  return (
    <div className="min-h-[60vh] bg-[#0A0A0A]">
      <section className="mx-auto max-w-[1400px] px-4 py-12 sm:px-6 sm:py-20">
        <h1
          className="mb-8 text-2xl font-bold uppercase tracking-tight text-white sm:text-3xl md:text-4xl"
          style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
        >
          About Darkloom
        </h1>

        <div className="prose prose-invert max-w-3xl space-y-8 text-white/80">
          <p className="text-base leading-relaxed sm:text-lg">
            Elite tabletop culture meets high-fashion streetwear. Darkloom
            creates premium apparel for adventurers who refuse to blend in — DnD
            themed drops that feel more like limited-edition fashion than gaming
            merch.
          </p>

          <h2
            className="text-xl font-bold uppercase tracking-tight text-white sm:text-2xl"
            style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
          >
            Our Mission
          </h2>
          <p className="text-base leading-relaxed">
            We believe tabletop culture deserves the same design rigor as
            high-end streetwear. Every piece is crafted for quality, comfort,
            and that unmistakable adventurer aesthetic — whether you&apos;re at
            the table or on the street.
          </p>

          <h2
            className="text-xl font-bold uppercase tracking-tight text-white sm:text-2xl"
            style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
          >
            The Team
          </h2>
          <p className="text-base leading-relaxed">
            A small team of designers, gamers, and streetwear enthusiasts united
            by a shared vision: to elevate DnD apparel from novelty to
            collectible. We source responsibly, design thoughtfully, and ship
            worldwide.
          </p>

          <h2
            className="text-xl font-bold uppercase tracking-tight text-white sm:text-2xl"
            style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
          >
            Connect
          </h2>
          <ul className="flex flex-wrap gap-4 text-sm">
            <li>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#FF4D00] underline decoration-[#FF4D00]/50 underline-offset-2 transition-colors hover:text-[#FF4D00] hover:decoration-[#FF4D00]"
              >
                Twitter / X
              </a>
            </li>
            <li>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#FF4D00] underline decoration-[#FF4D00]/50 underline-offset-2 transition-colors hover:text-[#FF4D00] hover:decoration-[#FF4D00]"
              >
                Instagram
              </a>
            </li>
            <li>
              <a
                href="https://discord.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#FF4D00] underline decoration-[#FF4D00]/50 underline-offset-2 transition-colors hover:text-[#FF4D00] hover:decoration-[#FF4D00]"
              >
                Discord
              </a>
            </li>
          </ul>
        </div>

        <div className="mt-12">
          <Link
            href="/shop"
            className="inline-block min-h-[44px] rounded-md bg-[#FF4D00] px-6 py-3 text-sm font-medium uppercase tracking-wider text-white transition-colors hover:bg-[#FF4D00]/90"
          >
            Shop Now
          </Link>
        </div>
      </section>
    </div>
  );
}
