/** DTOs and validation for checkout endpoint (CHK-002) */

export interface ShippingAddressInput {
  fullName?: string;
  line1?: string;
  line2?: string;
  city?: string;
  stateOrProvince?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

/** Supported shipping countries. Must match frontend select options. */
const SUPPORTED_COUNTRIES = [
  'EE', 'LV', 'LT', 'FI', 'SE', 'NO', 'DK', 'DE', 'FR', 'NL', 'BE', 'PL', 'ES', 'IT', 'AT', 'IE', 'PT',
  'CZ', 'GR', 'RO', 'HU', 'BG', 'HR', 'SK', 'SI', 'LU', 'CY', 'MT', 'GB', 'US', 'CA', 'CH', 'IS',
] as const;

/** Max lengths per DB/spec. */
const MAX_LENGTHS = {
  fullName: 200,
  line1: 255,
  line2: 255,
  city: 100,
  stateOrProvince: 100,
  postalCode: 20,
  phone: 30,
} as const;

/** Postal code format per country. Normalize (trim, collapse spaces) before matching. */
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

function normalizePostalCode(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

/** Phone: digits, spaces, hyphens, parentheses, plus. Length 10–30 chars, min 10 digits. */
const PHONE_PATTERN = /^[+\s\-()\d]{10,30}$/;
const PHONE_DIGITS_MIN = 10;

function hasControlChars(s: string): boolean {
  return /[\x00-\x1f\x7f]/.test(s);
}

export function validateShippingAddress(addr: unknown): ValidationError[] {
  const errors: ValidationError[] = [];
  const a = addr as Record<string, unknown>;

  if (!a || typeof a !== 'object') {
    errors.push({ field: 'shippingAddress', message: 'shippingAddress is required' });
    return errors;
  }

  const fullName = typeof a.fullName === 'string' ? a.fullName.trim() : '';
  if (!fullName) {
    errors.push({ field: 'shippingAddress.fullName', message: 'fullName is required' });
  } else {
    if (fullName.length > MAX_LENGTHS.fullName) {
      errors.push({ field: 'shippingAddress.fullName', message: `fullName must not exceed ${MAX_LENGTHS.fullName} characters` });
    }
    if (hasControlChars(fullName)) {
      errors.push({ field: 'shippingAddress.fullName', message: 'fullName contains invalid characters' });
    }
  }

  const line1 = typeof a.line1 === 'string' ? a.line1.trim() : '';
  if (!line1) {
    errors.push({ field: 'shippingAddress.line1', message: 'line1 is required' });
  } else {
    if (line1.length > MAX_LENGTHS.line1) {
      errors.push({ field: 'shippingAddress.line1', message: `line1 must not exceed ${MAX_LENGTHS.line1} characters` });
    }
    if (hasControlChars(line1)) {
      errors.push({ field: 'shippingAddress.line1', message: 'line1 contains invalid characters' });
    }
  }

  const line2 = typeof a.line2 === 'string' ? a.line2.trim() : '';
  if (line2 && line2.length > MAX_LENGTHS.line2) {
    errors.push({ field: 'shippingAddress.line2', message: `line2 must not exceed ${MAX_LENGTHS.line2} characters` });
  }
  if (line2 && hasControlChars(line2)) {
    errors.push({ field: 'shippingAddress.line2', message: 'line2 contains invalid characters' });
  }

  const city = typeof a.city === 'string' ? a.city.trim() : '';
  if (!city) {
    errors.push({ field: 'shippingAddress.city', message: 'city is required' });
  } else {
    if (city.length > MAX_LENGTHS.city) {
      errors.push({ field: 'shippingAddress.city', message: `city must not exceed ${MAX_LENGTHS.city} characters` });
    }
    if (hasControlChars(city)) {
      errors.push({ field: 'shippingAddress.city', message: 'city contains invalid characters' });
    }
  }

  const stateOrProvince = typeof a.stateOrProvince === 'string' ? a.stateOrProvince.trim() : '';
  if (!stateOrProvince) {
    errors.push({ field: 'shippingAddress.stateOrProvince', message: 'stateOrProvince is required' });
  } else {
    if (stateOrProvince.length > MAX_LENGTHS.stateOrProvince) {
      errors.push({ field: 'shippingAddress.stateOrProvince', message: `stateOrProvince must not exceed ${MAX_LENGTHS.stateOrProvince} characters` });
    }
  }

  const country = typeof a.country === 'string' ? a.country.trim().toUpperCase() : '';
  if (!country) {
    errors.push({ field: 'shippingAddress.country', message: 'country is required' });
  } else if (!SUPPORTED_COUNTRIES.includes(country as (typeof SUPPORTED_COUNTRIES)[number])) {
    errors.push({ field: 'shippingAddress.country', message: `country must be one of: ${SUPPORTED_COUNTRIES.join(', ')}` });
  }

  const postalCode = typeof a.postalCode === 'string' ? a.postalCode.trim() : '';
  if (!postalCode) {
    errors.push({ field: 'shippingAddress.postalCode', message: 'postalCode is required' });
  } else {
    if (postalCode.length > MAX_LENGTHS.postalCode) {
      errors.push({ field: 'shippingAddress.postalCode', message: `postalCode must not exceed ${MAX_LENGTHS.postalCode} characters` });
    }
    if (country && POSTAL_PATTERNS[country]) {
      const normalized = normalizePostalCode(postalCode);
      if (!POSTAL_PATTERNS[country].test(normalized)) {
        errors.push({ field: 'shippingAddress.postalCode', message: `postalCode format invalid for ${country}` });
      }
    }
  }

  const phone = typeof a.phone === 'string' ? a.phone.trim() : '';
  if (phone) {
    if (phone.length > MAX_LENGTHS.phone) {
      errors.push({ field: 'shippingAddress.phone', message: `phone must not exceed ${MAX_LENGTHS.phone} characters` });
    } else if (!PHONE_PATTERN.test(phone)) {
      errors.push({ field: 'shippingAddress.phone', message: 'phone format invalid' });
    } else {
      const digitCount = (phone.match(/\d/g) ?? []).length;
      if (digitCount < PHONE_DIGITS_MIN) {
        errors.push({ field: 'shippingAddress.phone', message: 'phone must contain at least 10 digits' });
      }
    }
  }

  return errors;
}
