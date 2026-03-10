"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { TwoFactorSetupForm } from "../../../../components/auth-forms";

export default function TwoFactorSetupPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <div className="mx-auto max-w-[560px] px-4 py-12">
        {/* Breadcrumb */}
        <nav className="mb-8 flex items-center gap-1 text-[11px] uppercase tracking-widest text-white/40">
          <Link href="/" className="hover:text-white transition-colors">
            Home
          </Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/account" className="hover:text-white transition-colors">
            Account
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-white/70">Security</span>
        </nav>

        {/* Card wrapper */}
        <div className="rounded-2xl border border-white/10 bg-[#1A1A1A] p-8">
          <TwoFactorSetupForm />
        </div>
      </div>
    </div>
  );
}
