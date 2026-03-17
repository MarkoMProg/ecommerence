import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "FAQ — Darkloom",
  description:
    "Frequently asked questions about shipping, payment, returns, and orders at Darkloom.",
};

const faqItems = [
  {
    section: "Shipping",
    qa: [
      {
        q: "How long does shipping take?",
        a: "Domestic orders typically ship within 2–3 business days and arrive within 5–7 business days. International orders may take 10–14 business days depending on destination.",
      },
      {
        q: "Do you ship internationally?",
        a: "Yes. We ship to most countries. Shipping costs and delivery times vary by location and are calculated at checkout.",
      },
      {
        q: "How can I track my order?",
        a: "Once your order ships, you'll receive an email with a tracking number. You can also view order status in your account.",
      },
    ],
  },
  {
    section: "Payment",
    qa: [
      {
        q: "What payment methods do you accept?",
        a: "We accept major credit and debit cards (Visa, Mastercard, American Express) and Apple Pay via Stripe. All payments are processed securely.",
      },
      {
        q: "Is my payment information secure?",
        a: "Yes. We use Stripe for payment processing. We do not store your full card details on our servers.",
      },
    ],
  },
  {
    section: "Returns",
    qa: [
      {
        q: "What is your return policy?",
        a: "Unworn, unwashed items in original packaging may be returned within 30 days of delivery for a full refund or exchange. Contact us to initiate a return.",
      },
      {
        q: "How do I start a return?",
        a: "Use our Contact form or email us with your order number and reason for return. We'll send you a return label and instructions.",
      },
      {
        q: "When will I get my refund?",
        a: "Refunds are processed within 5–7 business days after we receive your return. The refund will appear on your original payment method.",
      },
    ],
  },
];

export default function FAQPage() {
  return (
    <div className="min-h-[60vh] bg-[#0A0A0A]">
      <section className="mx-auto max-w-[1400px] px-4 py-12 sm:px-6 sm:py-20">
        <h1
          className="mb-4 text-2xl font-bold uppercase tracking-tight text-white sm:text-3xl md:text-4xl"
          style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
        >
          FAQ
        </h1>
        <p className="mb-12 max-w-xl text-sm text-white/70 sm:text-base">
          Common questions about shipping, payment, and returns. Can&apos;t find
          what you need?{" "}
          <Link
            href="/contact"
            className="text-[#FF4D00] underline decoration-[#FF4D00]/50 underline-offset-2 hover:decoration-[#FF4D00]"
          >
            Contact us
          </Link>
          .
        </p>

        <div className="space-y-12">
          {faqItems.map(({ section, qa }) => (
            <div key={section}>
              <h2
                className="mb-6 text-xl font-bold uppercase tracking-tight text-white sm:text-2xl"
                style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
              >
                {section}
              </h2>
              <ul className="space-y-6">
                {qa.map(({ q, a }) => (
                  <li key={q} className="border-b border-white/10 pb-6 last:border-0">
                    <h3 className="mb-2 font-semibold text-white">{q}</h3>
                    <p className="text-sm text-white/80 leading-relaxed">{a}</p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap gap-4">
          <Link
            href="/contact"
            className="inline-block min-h-[44px] rounded-md bg-[#FF4D00] px-6 py-3 text-sm font-medium uppercase tracking-wider text-white transition-colors hover:bg-[#FF4D00]/90"
          >
            Contact Us
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
