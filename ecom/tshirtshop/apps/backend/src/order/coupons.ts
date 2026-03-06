/**
 * Coupon definitions and validation.
 * FRESHP100: Free shipping.
 */

export interface CouponEffect {
  freeShipping?: boolean;
  /** Future: percentOff, fixedOffCents, etc. */
}

const COUPONS: Record<string, CouponEffect> = {
  FRESHP100: { freeShipping: true },
};

export function applyCoupon(code: string): CouponEffect | null {
  const normalized = code?.trim().toUpperCase();
  if (!normalized) return null;
  return COUPONS[normalized] ?? null;
}

export function isCouponValid(code: string): boolean {
  return applyCoupon(code) !== null;
}
