"use client";

import { useEffect, useState } from "react";
import {
  CreditCard,
  Star,
  Trash2,
  Plus,
  Check,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import {
  fetchMyPaymentMethods,
  createSetupSession,
  detachPaymentMethod,
  setDefaultPaymentMethod,
} from "@/lib/api/billing";
import type { SavedPaymentMethod } from "@/lib/api/billing";

/** Friendly brand display names. */
const BRAND_LABELS: Record<string, string> = {
  visa: "Visa",
  mastercard: "Mastercard",
  amex: "American Express",
  discover: "Discover",
  diners: "Diners Club",
  jcb: "JCB",
  unionpay: "UnionPay",
  unknown: "Card",
};

/** Brand accent colours (Tailwind-safe classes). */
const BRAND_COLORS: Record<string, string> = {
  visa: "text-blue-400",
  mastercard: "text-orange-400",
  amex: "text-cyan-400",
  discover: "text-amber-400",
  unknown: "text-white/50",
};

function brandLabel(brand: string): string {
  return BRAND_LABELS[brand.toLowerCase()] ?? brand.charAt(0).toUpperCase() + brand.slice(1);
}

function brandColor(brand: string): string {
  return BRAND_COLORS[brand.toLowerCase()] ?? "text-white/50";
}

function CardIcon({ brand }: { brand: string }) {
  return (
    <div
      className={`flex h-9 w-14 items-center justify-center rounded border border-white/15 bg-white/5 text-xs font-bold uppercase tracking-wider ${brandColor(brand)}`}
    >
      {brand === "visa" ? "VISA" : brand === "mastercard" ? "MC" : brand === "amex" ? "AMEX" : "CARD"}
    </div>
  );
}

function PaymentCard({
  method,
  onRemove,
  onSetDefault,
  actionLoading,
}: {
  method: SavedPaymentMethod;
  onRemove: () => void;
  onSetDefault: () => void;
  actionLoading: boolean;
}) {
  const [confirmRemove, setConfirmRemove] = useState(false);

  return (
    <div
      className={`flex items-center gap-4 rounded-lg border p-4 transition-colors ${
        method.isDefault
          ? "border-[#FF4D00]/30 bg-[#FF4D00]/5"
          : "border-white/10 bg-white/5"
      }`}
    >
      <CardIcon brand={method.brand} />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-white">
            {brandLabel(method.brand)} ····{method.last4}
          </span>
          {method.isDefault && (
            <span className="flex items-center gap-1 rounded bg-[#FF4D00]/20 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-[#FF4D00]">
              <Check className="size-2.5" />
              Default
            </span>
          )}
          {method.funding === "debit" && (
            <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-white/50">
              Debit
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs text-white/50">
          Expires {String(method.expMonth).padStart(2, "0")}/{method.expYear}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {!method.isDefault && (
          <button
            type="button"
            onClick={onSetDefault}
            disabled={actionLoading}
            className="flex h-8 items-center gap-1.5 rounded border border-white/15 px-2.5 text-[10px] uppercase tracking-wider text-white/60 hover:border-[#FF4D00]/40 hover:text-[#FF4D00]/80 disabled:opacity-40"
            title="Set as default"
          >
            <Star className="size-3" />
            <span className="hidden sm:inline">Default</span>
          </button>
        )}

        {!confirmRemove ? (
          <button
            type="button"
            onClick={() => setConfirmRemove(true)}
            disabled={actionLoading}
            className="flex h-8 w-8 items-center justify-center rounded text-white/40 hover:bg-red-500/15 hover:text-red-400 disabled:opacity-40"
            aria-label="Remove card"
          >
            <Trash2 className="size-3.5" />
          </button>
        ) : (
          <div className="flex items-center gap-1 rounded border border-red-500/30 bg-red-500/10 px-2 py-1">
            <span className="text-[10px] text-red-300">Remove?</span>
            <button
              type="button"
              onClick={() => { setConfirmRemove(false); onRemove(); }}
              disabled={actionLoading}
              className="text-[10px] text-red-300 hover:text-red-200 disabled:opacity-40"
            >
              Yes
            </button>
            <span className="text-white/30">/</span>
            <button
              type="button"
              onClick={() => setConfirmRemove(false)}
              className="text-[10px] text-white/50 hover:text-white"
            >
              No
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function PaymentMethodsSection() {
  const [methods, setMethods] = useState<SavedPaymentMethod[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [addingCard, setAddingCard] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [stripeNotConfigured, setStripeNotConfigured] = useState(false);

  useEffect(() => {
    // Detect redirect back from Stripe setup success
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("pm_added") === "1") {
        setJustAdded(true);
        const url = new URL(window.location.href);
        url.searchParams.delete("pm_added");
        window.history.replaceState({}, "", url.toString());
      }
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchMyPaymentMethods()
      .then((data) => {
        if (cancelled) return;
        setMethods(data);
        setLoaded(true);
      })
      .catch((err: Error & { code?: string }) => {
        if (cancelled) return;
        if (err.code === "STRIPE_NOT_CONFIGURED") {
          setStripeNotConfigured(true);
        } else {
          setLoadError(err.message);
        }
        setLoaded(true);
      });
    return () => { cancelled = true; };
  }, []);

  async function handleAddCard() {
    setAddingCard(true);
    try {
      const url = await createSetupSession();
      window.location.href = url;
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to start setup");
      setAddingCard(false);
    }
  }

  async function handleRemove(pmId: string) {
    setActionLoading(pmId);
    try {
      await detachPaymentMethod(pmId);
      const fresh = await fetchMyPaymentMethods();
      setMethods(fresh);
    } catch {
      // Silently ignore — very unlikely
    } finally {
      setActionLoading(null);
    }
  }

  async function handleSetDefault(pmId: string) {
    setActionLoading(pmId);
    try {
      await setDefaultPaymentMethod(pmId);
      const fresh = await fetchMyPaymentMethods();
      setMethods(fresh);
    } catch {
      // Silently ignore
    } finally {
      setActionLoading(null);
    }
  }

  if (stripeNotConfigured) return null;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
            <CreditCard className="size-5 text-white/50" />
            Payment Methods
          </h2>
          <p className="mt-0.5 text-sm text-white/60">
            Saved cards for faster checkout
          </p>
        </div>
        <button
          type="button"
          onClick={handleAddCard}
          disabled={addingCard}
          className="flex items-center gap-1.5 rounded-md border border-white/20 px-3 py-1.5 text-xs uppercase tracking-wider text-white/70 hover:bg-white/5 hover:text-white disabled:opacity-60"
        >
          {addingCard ? (
            <>
              <span className="size-3.5 animate-spin rounded-full border border-white/40 border-t-white" />
              Redirecting…
            </>
          ) : (
            <>
              <Plus className="size-3.5" />
              Add card
            </>
          )}
        </button>
      </div>

      {justAdded && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          <Check className="size-4 shrink-0" />
          Card added successfully.
        </div>
      )}

      {loadError && (
        <p className="mb-4 text-sm text-red-400">{loadError}</p>
      )}

      {!loaded ? (
        <p className="py-4 text-sm text-white/60">Loading…</p>
      ) : methods.length === 0 ? (
        <div className="rounded-lg border border-dashed border-white/10 p-8 text-center">
          <CreditCard className="mx-auto mb-2 size-8 text-white/20" />
          <p className="text-sm text-white/50">No saved cards yet.</p>
          <button
            type="button"
            onClick={handleAddCard}
            disabled={addingCard}
            className="mt-3 text-xs text-[#FF4D00] hover:underline disabled:opacity-60"
          >
            Add your first card
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {methods.map((method) => (
            <PaymentCard
              key={method.id}
              method={method}
              onRemove={() => handleRemove(method.id)}
              onSetDefault={() => handleSetDefault(method.id)}
              actionLoading={actionLoading === method.id}
            />
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center gap-1.5 text-[10px] text-white/30">
        <ShieldCheck className="size-3" />
        Cards are stored securely by Stripe. We never see your card number.
        <a
          href="https://stripe.com/docs/security/stripe"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-0.5 hover:text-white/50"
        >
          Learn more <ExternalLink className="size-2.5" />
        </a>
      </div>
    </div>
  );
}
