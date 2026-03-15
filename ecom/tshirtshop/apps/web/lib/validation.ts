/**
 * Shared client-side validation utilities.
 *
 * Mirrors the backend sanitize.ts validation rules so the user gets
 * instant feedback before submitting. The server remains the source
 * of truth — these checks are purely for UX.
 */

// ─── Sanitization ───────────────────────────────────────────────────────────

/** Strip ASCII control chars except newline and tab. */
export function stripControlChars(s: string): string {
  // eslint-disable-next-line no-control-regex -- intentionally matching control chars for sanitization
  return s.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, '');
}

/** Collapse consecutive whitespace to a single space and trim. */
export function sanitizeString(s: string): string {
  return stripControlChars(s).replace(/\s+/g, ' ').trim();
}

/** Returns true if string appears to contain HTML tags. */
export function containsHtml(s: string): boolean {
  return /<[a-z/!][^>]*>/i.test(s);
}

// ─── Syntactic Validators ───────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^[+\s\-()\d]{10,30}$/;
const PHONE_DIGITS_MIN = 10;

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}

export function isValidPhone(phone: string): boolean {
  const trimmed = phone.trim();
  if (!PHONE_RE.test(trimmed)) return false;
  const digitCount = (trimmed.match(/\d/g) ?? []).length;
  return digitCount >= PHONE_DIGITS_MIN;
}

export function isValidPassword(password: string): { valid: boolean; message: string } {
  if (password.length < 8) return { valid: false, message: 'Password must be at least 8 characters' };
  if (password.length > 128) return { valid: false, message: 'Password must not exceed 128 characters' };
  if (!/[A-Z]/.test(password)) return { valid: false, message: 'Password must contain an uppercase letter' };
  if (!/[a-z]/.test(password)) return { valid: false, message: 'Password must contain a lowercase letter' };
  if (!/\d/.test(password)) return { valid: false, message: 'Password must contain a number' };
  return { valid: true, message: '' };
}

// ─── Postal Code Validation ─────────────────────────────────────────────────

const POSTAL_PATTERNS: Record<string, RegExp> = {
  US: /^\d{5}([\s-]?\d{4})?$/,
  CA: /^[A-Za-z]\d[A-Za-z][\s-]?\d[A-Za-z]\d$/i,
  GB: /^[A-Za-z]{1,2}\d[A-Za-z\d]?\s?\d[A-Za-z]{2}$/i,
  EE: /^\d{5}$/,
  LV: /^(LV-)?\d{4}$/i,
  LT: /^(LT-)?\d{5}$/i,
  FI: /^\d{5}$/,
  SE: /^\d{3}\s?\d{2}$/,
  NO: /^\d{4}$/,
  DK: /^\d{4}$/,
  DE: /^\d{5}$/,
  FR: /^\d{5}$/,
  NL: /^\d{4}\s?[A-Za-z]{2}$/i,
  BE: /^\d{4}$/,
  PL: /^\d{2}-\d{3}$|^\d{5}$/,
  ES: /^\d{5}$/,
  IT: /^\d{5}$/,
  AT: /^\d{4}$/,
  PT: /^\d{4}-\d{3}$|^\d{7}$/,
  CZ: /^\d{3}\s?\d{2}$|^\d{5}$/,
  GR: /^\d{3}\s?\d{2}$|^\d{5}$/,
  RO: /^\d{6}$/,
  HU: /^\d{4}$/,
  BG: /^\d{4}$/,
  HR: /^\d{5}$/,
  SK: /^\d{3}\s?\d{2}$|^\d{5}$/,
  SI: /^\d{4}$/,
  LU: /^\d{4}$/,
  CY: /^\d{4}$/,
  MT: /^[A-Za-z]{3}\s?\d{2,4}$/i,
  CH: /^\d{4}$/,
  IS: /^\d{3}$/,
  IE: /^[A-Za-z0-9\s-]{3,10}$/i,
};

export function isValidPostalCode(code: string, country: string): boolean {
  const pattern = POSTAL_PATTERNS[country.toUpperCase()];
  if (!pattern) return true;
  return pattern.test(code.replace(/\s+/g, ' ').trim());
}

// ─── Semantic Bounds ────────────────────────────────────────────────────────

export const MAX_PRICE_CENTS = 99999999;        // $999,999.99
export const MAX_STOCK_QUANTITY = 999999;
export const MAX_REVIEW_BODY_LENGTH = 5000;
export const MAX_REVIEW_TITLE_LENGTH = 255;
export const MAX_PRODUCT_NAME_LENGTH = 255;
export const MAX_PRODUCT_DESCRIPTION_LENGTH = 10000;

export function isValidPriceCents(price: number): boolean {
  return Number.isInteger(price) && price >= 0 && price <= MAX_PRICE_CENTS;
}

export function isValidStockQuantity(qty: number): boolean {
  return Number.isInteger(qty) && qty >= 0 && qty <= MAX_STOCK_QUANTITY;
}

export function isValidRating(rating: number): boolean {
  return Number.isInteger(rating) && rating >= 1 && rating <= 5;
}

// ─── Whitelists ─────────────────────────────────────────────────────────────

export const SUPPORTED_COUNTRIES = [
  'EE', 'LV', 'LT', 'FI', 'SE', 'NO', 'DK', 'DE', 'FR', 'NL', 'BE', 'PL', 'ES', 'IT', 'AT', 'IE', 'PT',
  'CZ', 'GR', 'RO', 'HU', 'BG', 'HR', 'SK', 'SI', 'LU', 'CY', 'MT', 'GB', 'US', 'CA', 'CH', 'IS',
] as const;

export const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif', '.svg'] as const;

export function isValidImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false;
    const ext = parsed.pathname.toLowerCase().slice(parsed.pathname.lastIndexOf('.'));
    if (ext && ext.length > 1 && !(ALLOWED_IMAGE_EXTENSIONS as readonly string[]).includes(ext)) return false;
    return true;
  } catch {
    return false;
  }
}
