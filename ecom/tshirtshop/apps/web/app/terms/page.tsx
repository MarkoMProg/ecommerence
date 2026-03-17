import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service — Darkloom",
  description:
    "Terms of service for Darkloom. By using our store, you agree to these terms.",
};

export default function TermsPage() {
  return (
    <div className="min-h-[60vh] bg-[#0A0A0A]">
      <section className="mx-auto max-w-[1400px] px-4 py-12 sm:px-6 sm:py-20">
        <h1
          className="mb-8 text-2xl font-bold uppercase tracking-tight text-white sm:text-3xl md:text-4xl"
          style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
        >
          Terms of Service
        </h1>

        <p className="mb-8 text-sm text-white/50">
          Last updated: {new Date().toLocaleDateString("en-US")}
        </p>

        <div className="prose prose-invert max-w-3xl space-y-8 text-white/80">
          <h2
            className="text-xl font-bold uppercase tracking-tight text-white sm:text-2xl"
            style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
          >
            Acceptance of Terms
          </h2>
          <p className="text-base leading-relaxed">
            By accessing or using the Darkloom store, you agree to be bound by
            these Terms of Service. If you do not agree, please do not use our
            services.
          </p>

          <h2
            className="text-xl font-bold uppercase tracking-tight text-white sm:text-2xl"
            style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
          >
            Use of Service
          </h2>
          <p className="text-base leading-relaxed">
            You may use our store for lawful purposes only. You agree not to
            misuse our services, attempt unauthorized access, or interfere with
            the operation of the site.
          </p>

          <h2
            className="text-xl font-bold uppercase tracking-tight text-white sm:text-2xl"
            style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
          >
            Orders & Payments
          </h2>
          <p className="text-base leading-relaxed">
            All orders are subject to availability. We reserve the right to
            refuse or cancel orders. Payment is processed securely via Stripe.
            Prices are in USD unless otherwise stated.
          </p>

          <h2
            className="text-xl font-bold uppercase tracking-tight text-white sm:text-2xl"
            style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
          >
            Shipping & Returns
          </h2>
          <p className="text-base leading-relaxed">
            Shipping and return policies are described in our FAQ. By placing an
            order, you acknowledge our shipping and return terms.
          </p>

          <h2
            className="text-xl font-bold uppercase tracking-tight text-white sm:text-2xl"
            style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
          >
            Intellectual Property
          </h2>
          <p className="text-base leading-relaxed">
            All content on this site — including designs, logos, and product
            imagery — is owned by Darkloom or its licensors. You may not
            reproduce or use our content without permission.
          </p>

          <h2
            className="text-xl font-bold uppercase tracking-tight text-white sm:text-2xl"
            style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
          >
            Limitation of Liability
          </h2>
          <p className="text-base leading-relaxed">
            Darkloom is not liable for indirect, incidental, or consequential
            damages arising from your use of our services. Our liability is
            limited to the amount you paid for the relevant order.
          </p>

          <h2
            className="text-xl font-bold uppercase tracking-tight text-white sm:text-2xl"
            style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
          >
            Changes
          </h2>
          <p className="text-base leading-relaxed">
            We may update these terms from time to time. Continued use of our
            store after changes constitutes acceptance of the updated terms.
          </p>
        </div>

        <div className="mt-12 flex flex-wrap gap-4">
          <Link
            href="/faq"
            className="inline-block min-h-[44px] rounded-md bg-[#FF4D00] px-6 py-3 text-sm font-medium uppercase tracking-wider text-white transition-colors hover:bg-[#FF4D00]/90"
          >
            FAQ
          </Link>
          <Link
            href="/"
            className="inline-block min-h-[44px] rounded-md border border-white/20 px-6 py-3 text-sm font-medium uppercase tracking-wider text-white/80 transition-colors hover:bg-white/5"
          >
            Back to Store
          </Link>
        </div>
      </section>
    </div>
  );
}
