import type { Metadata } from "next";
import { ContactForm } from "./ContactForm";

export const metadata: Metadata = {
  title: "Contact — Darkloom",
  description:
    "Get in touch with Darkloom. Questions about orders, shipping, or our premium DnD apparel? We're here to help.",
};

export default function ContactPage() {
  return (
    <div className="min-h-[60vh] bg-[#0A0A0A]">
      <section className="mx-auto max-w-[1400px] px-4 py-12 sm:px-6 sm:py-20">
        <h1
          className="mb-4 text-2xl font-bold uppercase tracking-tight text-white sm:text-3xl md:text-4xl"
          style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
        >
          Contact
        </h1>
        <p className="mb-10 max-w-xl text-sm text-white/70 sm:text-base">
          Have a question about your order, shipping, or our products? Fill out
          the form below and we&apos;ll get back to you as soon as possible.
        </p>
        <ContactForm />
      </section>
    </div>
  );
}
