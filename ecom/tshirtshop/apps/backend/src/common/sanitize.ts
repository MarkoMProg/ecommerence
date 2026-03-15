/**
 * Shared input sanitization & validation utilities.
 *
 * Provides three layers of validation:
 *   1. Syntactic  — format checks (email, phone, postal code, URL)
 *   2. Semantic   — contextually appropriate values (price ranges, quantities, status transitions)
 *   3. Whitelist  — only allow known-good values (countries, order statuses, sort options, image mime types)
 *
 * All user-supplied strings should pass through `sanitizeString` before storage
 * to strip control characters, collapse whitespace, and trim.
 */

// ─── Sanitization ───────────────────────────────────────────────────────────

/** Strip ASCII control characters (U+0000–U+001F, U+007F) except newline and tab. */
export function stripControlChars(s: string): string {
  // eslint-disable-next-line no-control-regex -- intentionally matching control chars for sanitization
  return s.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, '');
}

/** Collapse consecutive whitespace to a single space and trim. */
export function collapseWhitespace(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

/**
 * Sanitize a user-supplied string: strip control chars, collapse whitespace, trim.
 * Returns empty string for null/undefined/non-string input.
 */
export function sanitizeString(input: unknown): string {
  if (typeof input !== 'string') return '';
  return collapseWhitespace(stripControlChars(input));
}

/**
 * Sanitize a multiline string: strip control chars (except newlines), trim.
 * Used for review bodies, descriptions, and other long-form text.
 */
export function sanitizeMultilineString(input: unknown): string {
  if (typeof input !== 'string') return '';
  return stripControlChars(input).trim();
}

/** Returns true if the string contains characters that suggest HTML/script injection. */
export function containsHtml(s: string): boolean {
  return /<[a-z/!][^>]*>/i.test(s);
}

/** Returns true if the string contains control characters (excluding newline/tab). */
export function hasControlChars(s: string): boolean {
  // eslint-disable-next-line no-control-regex -- intentionally matching control chars
  return /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(s);
}

// ─── Syntactic Validation ───────────────────────────────────────────────────

/** RFC 5322 simplified email pattern. */
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** UUID v4 pattern. */
export const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** URL pattern (http/https only). */
export const URL_RE = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;

/** Phone: digits, spaces, hyphens, parentheses, plus. 10–30 chars, min 10 digits. */
export const PHONE_RE = /^[+\s\-()\d]{10,30}$/;
export const PHONE_DIGITS_MIN = 10;

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email);
}

export function isValidUuid(id: string): boolean {
  return UUID_RE.test(id);
}

export function isValidUrl(url: string): boolean {
  return URL_RE.test(url);
}

export function isValidPhone(phone: string): boolean {
  if (!PHONE_RE.test(phone)) return false;
  const digitCount = (phone.match(/\d/g) ?? []).length;
  return digitCount >= PHONE_DIGITS_MIN;
}

// ─── Semantic Validation ────────────────────────────────────────────────────

/** Price must be a non-negative integer (cents). Max $999,999.99 */
export const MAX_PRICE_CENTS = 99999999;

/** Stock quantity must be non-negative integer. Max 999,999 units. */
export const MAX_STOCK_QUANTITY = 999999;

/** Max cart item quantity per line. */
export const MAX_CART_ITEM_QUANTITY = 99;

/** Max review body length. */
export const MAX_REVIEW_BODY_LENGTH = 5000;

/** Max review title length. */
export const MAX_REVIEW_TITLE_LENGTH = 255;

/** Max product name length. */
export const MAX_PRODUCT_NAME_LENGTH = 255;

/** Max product description length. */
export const MAX_PRODUCT_DESCRIPTION_LENGTH = 10000;

export function isValidPriceCents(price: number): boolean {
  return Number.isInteger(price) && price >= 0 && price <= MAX_PRICE_CENTS;
}

export function isValidStockQuantity(qty: number): boolean {
  return Number.isInteger(qty) && qty >= 0 && qty <= MAX_STOCK_QUANTITY;
}

export function isValidCartQuantity(qty: number): boolean {
  return Number.isInteger(qty) && qty >= 1 && qty <= MAX_CART_ITEM_QUANTITY;
}

export function isValidRating(rating: number): boolean {
  return Number.isInteger(rating) && rating >= 1 && rating <= 5;
}

// ─── Whitelisting ───────────────────────────────────────────────────────────

/** Supported shipping countries (ISO 3166-1 alpha-2). */
export const SUPPORTED_COUNTRIES = [
  'EE',
  'LV',
  'LT',
  'FI',
  'SE',
  'NO',
  'DK',
  'DE',
  'FR',
  'NL',
  'BE',
  'PL',
  'ES',
  'IT',
  'AT',
  'IE',
  'PT',
  'CZ',
  'GR',
  'RO',
  'HU',
  'BG',
  'HR',
  'SK',
  'SI',
  'LU',
  'CY',
  'MT',
  'GB',
  'US',
  'CA',
  'CH',
  'IS',
] as const;

export type SupportedCountry = (typeof SUPPORTED_COUNTRIES)[number];

export function isValidCountry(code: string): code is SupportedCountry {
  return SUPPORTED_COUNTRIES.includes(code.toUpperCase() as SupportedCountry);
}

/** Valid order statuses. */
export const ORDER_STATUSES = [
  'pending',
  'paid',
  'shipped',
  'completed',
  'cancelled',
  'refunded',
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export function isValidOrderStatus(status: string): status is OrderStatus {
  return ORDER_STATUSES.includes(status.toLowerCase() as OrderStatus);
}

/** Valid sort options for product listing. */
export const PRODUCT_SORT_OPTIONS = [
  'newest',
  'price-asc',
  'price-desc',
  'name-asc',
  'name-desc',
  'rating-desc',
] as const;
export type ProductSortOption = (typeof PRODUCT_SORT_OPTIONS)[number];

export function isValidSortOption(sort: string): sort is ProductSortOption {
  return PRODUCT_SORT_OPTIONS.includes(sort as ProductSortOption);
}

/** Allowed image URL protocols. */
export const ALLOWED_IMAGE_PROTOCOLS = ['https:'] as const;

/** Allowed image file extensions. */
export const ALLOWED_IMAGE_EXTENSIONS = [
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.avif',
  '.gif',
  '.svg',
] as const;

export function isValidImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (
      !ALLOWED_IMAGE_PROTOCOLS.includes(
        parsed.protocol as (typeof ALLOWED_IMAGE_PROTOCOLS)[number],
      )
    ) {
      // Allow http in development
      if (parsed.protocol !== 'http:') return false;
    }
    const ext = parsed.pathname
      .toLowerCase()
      .slice(parsed.pathname.lastIndexOf('.'));
    // Allow URLs without file extension (CDN/dynamic image URLs)
    if (
      ext &&
      ext.length > 1 &&
      !ALLOWED_IMAGE_EXTENSIONS.includes(
        ext as (typeof ALLOWED_IMAGE_EXTENSIONS)[number],
      )
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/** Postal code format patterns per country. */
export const POSTAL_PATTERNS: Record<string, RegExp> = {
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
  if (!pattern) return true; // no pattern = accept any
  return pattern.test(code.replace(/\s+/g, ' ').trim());
}
