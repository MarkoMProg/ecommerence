"use client";

import { AddressesSection } from "./AddressesSection";

export default function AddressesPage() {
  return (
    <div className="space-y-6 pb-12">
      <div className="border-b border-white/10 pb-6">
        <p className="mb-1 text-[10px] uppercase tracking-widest text-white/40">
          Account
        </p>
        <h1
          className="text-2xl font-bold uppercase tracking-tight text-white sm:text-3xl"
          style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
        >
          Addresses
        </h1>
        <p className="mt-1 text-sm text-white/50">
          Manage your saved shipping and billing addresses
        </p>
      </div>
      <AddressesSection />
    </div>
  );
}
