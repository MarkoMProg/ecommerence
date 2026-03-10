"use client";

import { useAuth } from "@/components/auth-provider";
import { User2, Mail, Hash } from "lucide-react";

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="flex items-start gap-4 py-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5">
        <Icon className="size-3.5 text-white/40" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-widest text-white/40">
          {label}
        </p>
        <p className="mt-0.5 text-sm text-white">
          {value || <span className="text-white/30">Not set</span>}
        </p>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { session } = useAuth();
  const user = session?.user;

  if (!user) return null;

  const initials = getInitials(user.name || user.email);

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
          Profile
        </h1>
        <p className="mt-1 text-sm text-white/50">Your account information</p>
      </div>

      {/* Avatar + name hero */}
      <div className="flex items-center gap-5 rounded-xl border border-white/10 bg-[#1A1A1A] p-6">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#FF4D00] text-xl font-bold text-white">
          {initials}
        </div>
        <div>
          <p
            className="text-xl font-bold uppercase tracking-tight text-white"
            style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
          >
            {user.name || "—"}
          </p>
          <p className="text-sm text-white/50">{user.email}</p>
        </div>
      </div>

      {/* Info rows */}
      <div className="rounded-xl border border-white/10 bg-[#1A1A1A] px-6 divide-y divide-white/5">
        <InfoRow icon={User2} label="Full Name" value={user.name} />
        <InfoRow icon={Mail} label="Email Address" value={user.email} />
        <InfoRow
          icon={Hash}
          label="Account ID"
          value={`…${user.id.slice(-10)}`}
        />
      </div>

      {/* Future edit note */}
      <p className="text-center text-xs text-white/25">
        To update your name or email, contact support.
      </p>
    </div>
  );
}
