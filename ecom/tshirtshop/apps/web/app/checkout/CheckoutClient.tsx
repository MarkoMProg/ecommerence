"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Cart } from "@/lib/api/cart";
import { createOrder, InsufficientStockError } from "@/lib/api/checkout";
import { fetchMyAddresses } from "@/lib/api/addresses";
import type { SavedAddress } from "@/lib/api/addresses";
import { fetchMyPaymentMethods } from "@/lib/api/billing";
import type { SavedPaymentMethod } from "@/lib/api/billing";
import { useAuth } from "@/components/auth-provider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CheckoutClientProps {
  cart: Cart;
  canceled?: boolean;
}

/** Shipping address form state */
interface ShippingAddress {
  fullName: string;
  line1: string;
  line2: string;
  city: string;
  stateOrProvince: string;
  postalCode: string;
  country: string;
  phone: string;
}

/** ISO 3166-1 alpha-2 codes. Estonia first (base location), then EU/EEA, then others. */
const COUNTRIES: { code: string; name: string }[] = [
  { code: "EE", name: "Estonia" },
  { code: "LV", name: "Latvia" },
  { code: "LT", name: "Lithuania" },
  { code: "FI", name: "Finland" },
  { code: "SE", name: "Sweden" },
  { code: "NO", name: "Norway" },
  { code: "DK", name: "Denmark" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "NL", name: "Netherlands" },
  { code: "BE", name: "Belgium" },
  { code: "PL", name: "Poland" },
  { code: "ES", name: "Spain" },
  { code: "IT", name: "Italy" },
  { code: "AT", name: "Austria" },
  { code: "IE", name: "Ireland" },
  { code: "PT", name: "Portugal" },
  { code: "CZ", name: "Czech Republic" },
  { code: "GR", name: "Greece" },
  { code: "RO", name: "Romania" },
  { code: "HU", name: "Hungary" },
  { code: "BG", name: "Bulgaria" },
  { code: "HR", name: "Croatia" },
  { code: "SK", name: "Slovakia" },
  { code: "SI", name: "Slovenia" },
  { code: "LU", name: "Luxembourg" },
  { code: "CY", name: "Cyprus" },
  { code: "MT", name: "Malta" },
  { code: "GB", name: "United Kingdom" },
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "CH", name: "Switzerland" },
  { code: "IS", name: "Iceland" },
];

const initialAddress: ShippingAddress = {
  fullName: "",
  line1: "",
  line2: "",
  city: "",
  stateOrProvince: "",
  postalCode: "",
  country: "EE",
  phone: "",
};

const FREE_SHIPPING_CENTS = 7500;
const DEFAULT_SHIPPING_CENTS = 599;

/** FRESHP100 = free shipping. Case-insensitive. */
function isFreeShippingCoupon(code: string): boolean {
  return code?.trim().toUpperCase() === "FRESHP100";
}

function isAddressValid(a: ShippingAddress): boolean {
  return !!(
    a.fullName?.trim() &&
    a.line1?.trim() &&
    a.city?.trim() &&
    a.stateOrProvince?.trim() &&
    a.postalCode?.trim() &&
    a.country?.trim()
  );
}

export function CheckoutClient({ cart, canceled = false }: CheckoutClientProps) {
  const router = useRouter();
  const { session } = useAuth();
  const [address, setAddress] = useState<ShippingAddress>(initialAddress);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [placeStatus, setPlaceStatus] = useState<"idle" | "loading" | "error">("idle");
  const [placeError, setPlaceError] = useState<string | null>(null);
  const [stockError, setStockError] = useState<string | null>(null);

  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("manual");
  const [defaultPaymentMethod, setDefaultPaymentMethod] = useState<SavedPaymentMethod | null>(null);

  useEffect(() => {
    if (!session?.user) return;
    let cancelled = false;
    fetchMyAddresses()
      .then((data) => {
        if (cancelled) return;
        setSavedAddresses(data);
        const defaultShipping = data.find((a) => a.isDefaultShipping);
        if (defaultShipping) {
          setSelectedAddressId(defaultShipping.id);
          setAddress({
            fullName: defaultShipping.fullName,
            line1: defaultShipping.line1,
            line2: defaultShipping.line2 ?? "",
            city: defaultShipping.city,
            stateOrProvince: defaultShipping.stateOrRegion,
            postalCode: defaultShipping.postalCode,
            country: defaultShipping.country,
            phone: defaultShipping.phone ?? "",
          });
        }
      })
      .catch(() => { /* guest or unauthenticated — ignore */ });

    fetchMyPaymentMethods()
      .then((pms) => {
        if (cancelled) return;
        const def = pms.find((p) => p.isDefault) ?? pms[0] ?? null;
        setDefaultPaymentMethod(def);
      })
      .catch(() => { /* Stripe not configured or not logged in */ });

    return () => { cancelled = true; };
  }, [session?.user]);

  function applySelectedAddress(id: string) {
    setSelectedAddressId(id);
    if (id === "manual") {
      setAddress(initialAddress);
      return;
    }
    const addr = savedAddresses.find((a) => a.id === id);
    if (!addr) return;
    setAddress({
      fullName: addr.fullName,
      line1: addr.line1,
      line2: addr.line2 ?? "",
      city: addr.city,
      stateOrProvince: addr.stateOrRegion,
      postalCode: addr.postalCode,
      country: addr.country,
      phone: addr.phone ?? "",
    });
  }

  const freeShippingByCoupon = appliedCoupon ? isFreeShippingCoupon(appliedCoupon) : false;
  const shippingCents =
    freeShippingByCoupon || cart.totalCents >= FREE_SHIPPING_CENTS ? 0 : DEFAULT_SHIPPING_CENTS;
  const totalCents = cart.totalCents + shippingCents;
  const totalDollars = (totalCents / 100).toFixed(2);
  const subtotalDollars = (cart.totalCents / 100).toFixed(2);
  const canPlace = isAddressValid(address);

  function updateAddress(field: keyof ShippingAddress, value: string) {
    setAddress((prev) => ({ ...prev, [field]: value }));
    setPlaceError(null);
  }

  async function handlePlaceOrder(e: React.FormEvent) {
    e.preventDefault();
    if (!canPlace || placeStatus === "loading") return;
    setPlaceStatus("loading");
    setPlaceError(null);
    setStockError(null);
    try {
      const { order, checkoutUrl } = await createOrder(
        {
          fullName: address.fullName.trim(),
          line1: address.line1.trim(),
          line2: address.line2.trim() || undefined,
          city: address.city.trim(),
          stateOrProvince: address.stateOrProvince.trim(),
          postalCode: address.postalCode.trim(),
          country: address.country.trim(),
          phone: address.phone.trim() || undefined,
        },
        cart.id,
        appliedCoupon
      );
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        router.push(`/checkout/confirmation?orderId=${order.id}`);
      }
    } catch (err) {
      if (err instanceof InsufficientStockError) {
        const names = err.failures.map((f) =>
          f.available === 0
            ? `${f.productName} (out of stock)`
            : `${f.productName} (only ${f.available} available)`
        );
        setStockError(
          names.length === 1
            ? `${names[0]} — please update your cart before continuing.`
            : `Some items are no longer available: ${names.join(", ")}. Please update your cart.`
        );
      } else {
        setPlaceError(err instanceof Error ? err.message : "Failed to create order");
      }
    } finally {
      setPlaceStatus("idle");
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
      {canceled && (
        <div className="col-span-full rounded-lg border border-amber-500/50 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          Payment was cancelled. You can place your order again below.
        </div>
      )}
      {/* Left: Shipping & Payment */}
      <div className="space-y-8">
        {/* Shipping address */}
        <section className="rounded-lg border border-white/10 bg-white/5 p-6">
          <h2 className="mb-6 text-sm font-medium uppercase tracking-wider text-white">
            Shipping address
          </h2>

          {savedAddresses.length > 0 && (
            <div className="mb-6">
              <label className="mb-1 block text-xs uppercase tracking-widest text-white/60">
                Use saved address
              </label>
              <Select value={selectedAddressId} onValueChange={applySelectedAddress}>
                <SelectTrigger className="min-h-[44px] w-full px-4 py-2">
                  <SelectValue placeholder="Select a saved address…" />
                </SelectTrigger>
                <SelectContent>
                  {savedAddresses.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.label} — {a.fullName}, {a.city}
                      {a.isDefaultShipping ? " (Default)" : ""}
                    </SelectItem>
                  ))}
                  <SelectItem value="manual">Enter new address manually</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <form id="checkout-form" className="grid gap-4 sm:grid-cols-2" onSubmit={handlePlaceOrder}>
            <div className="sm:col-span-2">
              <label htmlFor="checkout-fullName" className="mb-1 block text-xs uppercase tracking-widest text-white/60">
                Full name
              </label>
              <input
                id="checkout-fullName"
                type="text"
                value={address.fullName}
                onChange={(e) => updateAddress("fullName", e.target.value)}
                className="min-h-[44px] w-full rounded-md border border-white/20 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/40 focus:border-[#FF4D00] focus:outline-none focus:ring-1 focus:ring-[#FF4D00]"
                placeholder="Jane Doe"
                autoComplete="name"
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="checkout-line1" className="mb-1 block text-xs uppercase tracking-widest text-white/60">
                Address line 1
              </label>
              <input
                id="checkout-line1"
                type="text"
                value={address.line1}
                onChange={(e) => updateAddress("line1", e.target.value)}
                className="min-h-[44px] w-full rounded-md border border-white/20 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/40 focus:border-[#FF4D00] focus:outline-none focus:ring-1 focus:ring-[#FF4D00]"
                placeholder="123 Main St"
                autoComplete="address-line1"
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="checkout-line2" className="mb-1 block text-xs uppercase tracking-widest text-white/60">
                Address line 2
              </label>
              <input
                id="checkout-line2"
                type="text"
                value={address.line2}
                onChange={(e) => updateAddress("line2", e.target.value)}
                className="min-h-[44px] w-full rounded-md border border-white/20 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/40 focus:border-[#FF4D00] focus:outline-none focus:ring-1 focus:ring-[#FF4D00]"
                placeholder="Apt 4 (optional)"
                autoComplete="address-line2"
              />
            </div>
            <div>
              <label htmlFor="checkout-city" className="mb-1 block text-xs uppercase tracking-widest text-white/60">
                City
              </label>
              <input
                id="checkout-city"
                type="text"
                value={address.city}
                onChange={(e) => updateAddress("city", e.target.value)}
                className="min-h-[44px] w-full rounded-md border border-white/20 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/40 focus:border-[#FF4D00] focus:outline-none focus:ring-1 focus:ring-[#FF4D00]"
                placeholder="Austin"
                autoComplete="address-level2"
              />
            </div>
            <div>
              <label htmlFor="checkout-state" className="mb-1 block text-xs uppercase tracking-widest text-white/60">
                State / Province
              </label>
              <input
                id="checkout-state"
                type="text"
                value={address.stateOrProvince}
                onChange={(e) => updateAddress("stateOrProvince", e.target.value)}
                className="min-h-[44px] w-full rounded-md border border-white/20 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/40 focus:border-[#FF4D00] focus:outline-none focus:ring-1 focus:ring-[#FF4D00]"
                placeholder="TX"
                autoComplete="address-level1"
              />
            </div>
            <div>
              <label htmlFor="checkout-postal" className="mb-1 block text-xs uppercase tracking-widest text-white/60">
                Postal code
              </label>
              <input
                id="checkout-postal"
                type="text"
                value={address.postalCode}
                onChange={(e) => updateAddress("postalCode", e.target.value)}
                className="min-h-[44px] w-full rounded-md border border-white/20 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/40 focus:border-[#FF4D00] focus:outline-none focus:ring-1 focus:ring-[#FF4D00]"
                placeholder="78701"
                autoComplete="postal-code"
              />
            </div>
            <div>
              <label htmlFor="checkout-country" className="mb-1 block text-xs uppercase tracking-widest text-white/60">
                Country
              </label>
              <Select
                value={address.country}
                onValueChange={(v) => updateAddress("country", v)}
              >
                <SelectTrigger
                  id="checkout-country"
                  className="min-h-[44px] w-full px-4 py-2"
                >
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="checkout-phone" className="mb-1 block text-xs uppercase tracking-widest text-white/60">
                Phone
              </label>
              <input
                id="checkout-phone"
                type="tel"
                value={address.phone}
                onChange={(e) => updateAddress("phone", e.target.value)}
                className="min-h-[44px] w-full rounded-md border border-white/20 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/40 focus:border-[#FF4D00] focus:outline-none focus:ring-1 focus:ring-[#FF4D00]"
                placeholder="+1 (555) 123-4567"
                autoComplete="tel"
              />
            </div>
          </form>
        </section>

        {/* Payment - Stripe Checkout (PAY-001) or direct confirmation */}
        <section className="rounded-lg border border-white/10 bg-white/5 p-6">
          <h2 className="mb-6 text-sm font-medium uppercase tracking-wider text-white">
            Payment
          </h2>
          {defaultPaymentMethod ? (
            <div className="rounded-md border border-[#FF4D00]/20 bg-[#FF4D00]/5 p-4">
              <p className="mb-1 text-xs uppercase tracking-widest text-white/50">
                Saved card on file
              </p>
              <p className="text-sm font-medium text-white">
                {defaultPaymentMethod.brand.charAt(0).toUpperCase() + defaultPaymentMethod.brand.slice(1)}{" "}
                ····{defaultPaymentMethod.last4}
              </p>
              <p className="mt-0.5 text-xs text-white/50">
                Expires {String(defaultPaymentMethod.expMonth).padStart(2, "0")}/{defaultPaymentMethod.expYear}
              </p>
              <p className="mt-3 text-xs text-white/40">
                This card will appear as an option on the Stripe payment page. You can choose a different method there.
              </p>
            </div>
          ) : (
            <div className="rounded-md border border-dashed border-white/20 bg-white/5 p-6 text-center">
              <p className="text-sm text-white/60">
                Payment is collected securely after you place your order.
              </p>
              <p className="mt-2 text-xs text-white/40">
                You may be redirected to Stripe Checkout if configured.
              </p>
            </div>
          )}
        </section>
      </div>

      {/* Right: Order summary */}
      <div>
        <section className="sticky top-24 rounded-lg border border-white/10 bg-white/5 p-6">
          <h2 className="mb-6 text-sm font-medium uppercase tracking-wider text-white">
            Order summary
          </h2>
          <ul className="mb-6 space-y-4 border-b border-white/10 pb-6">
            {cart.items.map((item) => {
              const itemTotal = ((item.priceCents * item.quantity) / 100).toFixed(2);
              return (
                <li key={item.id} className="flex gap-4">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded bg-[#1A1A1A]">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.productName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[10px] text-white/40">
                        —
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">
                      {item.productName}
                    </p>
                    <p className="text-xs text-white/60">
                      Qty {item.quantity} × ${(item.priceCents / 100).toFixed(2)}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-medium text-[#E6C068]">
                    ${itemTotal}
                  </p>
                </li>
              );
            })}
          </ul>
          <div className="mb-4">
            <label htmlFor="checkout-coupon" className="mb-1 block text-xs uppercase tracking-widest text-white/60">
              Coupon
            </label>
            <div className="flex gap-2">
              <input
                id="checkout-coupon"
                type="text"
                value={appliedCoupon ?? couponCode}
                onChange={(e) => {
                  setCouponCode(e.target.value);
                  if (!appliedCoupon) setPlaceError(null);
                }}
                placeholder={appliedCoupon ? appliedCoupon : "Enter code"}
                disabled={!!appliedCoupon}
                className="min-h-[44px] flex-1 rounded-md border border-white/20 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/40 focus:border-[#FF4D00] focus:outline-none focus:ring-1 focus:ring-[#FF4D00] disabled:opacity-70"
              />
              {appliedCoupon ? (
                <button
                  type="button"
                  onClick={() => {
                    setAppliedCoupon(null);
                    setCouponCode("");
                  }}
                  className="min-h-[44px] rounded-md border border-white/20 px-4 py-2 text-xs uppercase tracking-wider text-white/80 hover:bg-white/5"
                >
                  Remove
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    const code = couponCode.trim();
                    if (!code) return;
                    if (isFreeShippingCoupon(code)) {
                      setAppliedCoupon(code.toUpperCase());
                      setPlaceError(null);
                    } else {
                      setPlaceError("Invalid coupon code");
                    }
                  }}
                  className="min-h-[44px] shrink-0 rounded-md bg-white/10 px-4 py-2 text-xs uppercase tracking-wider text-white hover:bg-white/20"
                >
                  Apply
                </button>
              )}
            </div>
            {appliedCoupon && (
              <p className="mt-1 text-xs text-[#4ADE80]">Free shipping applied</p>
            )}
          </div>
          <div className="mb-6 space-y-2">
            <div className="flex justify-between text-sm text-white/80">
              <span>Subtotal</span>
              <span>${subtotalDollars}</span>
            </div>
            <div className="flex justify-between text-sm text-white/60">
              <span>Shipping</span>
              <span className={shippingCents === 0 ? "text-[#4ADE80]" : ""}>
                {shippingCents === 0 ? "Free" : `$${(shippingCents / 100).toFixed(2)}`}
              </span>
            </div>
          </div>
          <div className="mb-6 flex justify-between border-t border-white/10 pt-4 text-lg font-medium text-white">
            <span>Total</span>
            <span className="text-[#E6C068]">${totalDollars}</span>
          </div>

          {stockError && (
            <div className="mb-4 rounded-md border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
              <p className="mb-1 font-medium">Some items are no longer available</p>
              <p className="text-xs text-amber-200/80">{stockError}</p>
              <Link href="/cart" className="mt-2 inline-block text-xs font-medium text-amber-300 underline hover:text-amber-100">
                Review your cart →
              </Link>
            </div>
          )}
          {placeError && (
            <p className="mb-4 text-sm text-red-400">{placeError}</p>
          )}
          <button
            type="submit"
            form="checkout-form"
            disabled={!canPlace || placeStatus === "loading"}
            className="flex w-full min-h-[48px] items-center justify-center rounded-md bg-[#FF4D00] py-4 text-sm font-medium uppercase tracking-wider text-white transition-colors hover:bg-[#FF4D00]/90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {placeStatus === "loading" ? "Placing…" : "Place Order"}
          </button>
          <p className="mt-3 text-center text-[10px] text-white/40">
            Order created as pending. Redirect to Stripe or confirmation.
          </p>
        </section>
      </div>
    </div>
  );
}
