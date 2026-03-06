"use client";

import Link from "next/link";
import { ShieldCheck, ShieldOff, LogOut, ExternalLink } from "lucide-react";
import { useAuth } from "@/components/auth-provider";

export default function SecurityPage() {
  const { session, signOut } = useAuth();
  const user = session?.user;
  const twoFactorEnabled = !!(user as any)?.twoFactorEnabled;

  if (!user) return null;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="border-b border-white/10 pb-6">
        <p className="mb-1 text-[10px] uppercase tracking-widest text-white/40">
          Account
        </p>
        <h1
          className="text-2xl font-bold uppercase tracking-tight text-white sm:text-3xl"
          style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
        >
          Security
        </h1>
        <p className="mt-1 text-sm text-white/50">
          Manage two-factor authentication and sign-out
        </p>
      </div>

      {/* 2FA card */}
      <div className="rounded-xl border border-white/10 bg-[#1A1A1A] p-6">
        <div className="flex items-start gap-4">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${
              twoFactorEnabled
                ? "border-emerald-500/30 bg-emerald-500/10"
                : "border-white/10 bg-white/5"
            }`}
          >
            {twoFactorEnabled ? (
              <ShieldCheck className="size-5 text-emerald-400" />
            ) : (
              <ShieldOff className="size-5 text-white/30" />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3
                className="text-sm font-bold uppercase tracking-tight text-white"
                style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
              >
                Two-Factor Authentication
              </h3>
              <span
                className={`rounded px-2 py-0.5 text-[9px] uppercase tracking-widest ${
                  twoFactorEnabled
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-white/10 text-white/40"
                }`}
              >
                {twoFactorEnabled ? "Enabled" : "Disabled"}
              </span>
            </div>
            <p className="mt-1.5 text-xs text-white/50">
              {twoFactorEnabled
                ? "Your account is protected with a second verification step via an authenticator app."
                : "Add a second layer of security using an authenticator app such as Google Authenticator or Authy."}
            </p>
            <Link
              href="/auth/two-factor/setup"
              className="mt-4 inline-flex items-center gap-2 rounded-md border border-white/20 px-4 py-2 text-[10px] uppercase tracking-wider text-white/70 hover:bg-white/5 hover:text-white transition-colors"
            >
              <ExternalLink className="size-3.5" />
              {twoFactorEnabled ? "Manage 2FA" : "Enable 2FA"}
            </Link>
          </div>
        </div>
      </div>

      {/* Danger zone */}
      <div className="rounded-xl border border-red-500/15 bg-red-500/[0.03] p-6">
        <h3
          className="mb-1 text-[11px] font-bold uppercase tracking-widest text-red-400/60"
          style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
        >
          Danger Zone
        </h3>
        <p className="mb-4 text-xs text-white/40">
          Sign out of your account on this device.
        </p>
        <button
          type="button"
          onClick={() => signOut()}
          className="flex items-center gap-2 rounded-md border border-red-500/30 bg-red-500/10 px-4 py-2 text-[10px] font-medium uppercase tracking-wider text-red-400 hover:bg-red-500/20 transition-colors"
        >
          <LogOut className="size-3.5" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
