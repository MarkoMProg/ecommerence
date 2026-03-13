/** DTOs and validation for checkout endpoint (CHK-002) */

import {
  sanitizeString,
  hasControlChars,
  containsHtml,
  isValidPhone,
  isValidCountry,
  isValidPostalCode,
  SUPPORTED_COUNTRIES,
} from '../../common/sanitize';

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

export function validateShippingAddress(addr: unknown): ValidationError[] {
  const errors: ValidationError[] = [];
  const a = addr as Record<string, unknown>;

  if (!a || typeof a !== 'object') {
    errors.push({ field: 'shippingAddress', message: 'shippingAddress is required' });
    return errors;
  }

  // Helper: check raw string for control chars before sanitizing
  const raw = (v: unknown): string => (typeof v === 'string' ? v : '');

  const fullName = sanitizeString(a.fullName);
  if (!fullName) {
    errors.push({ field: 'shippingAddress.fullName', message: 'fullName is required' });
  } else {
    if (fullName.length > MAX_LENGTHS.fullName) {
      errors.push({ field: 'shippingAddress.fullName', message: `fullName must not exceed ${MAX_LENGTHS.fullName} characters` });
    }
    if (hasControlChars(raw(a.fullName))) {
      errors.push({ field: 'shippingAddress.fullName', message: 'fullName contains invalid characters' });
    }
    if (containsHtml(fullName)) {
      errors.push({ field: 'shippingAddress.fullName', message: 'fullName must not contain HTML' });
    }
  }

  const line1 = sanitizeString(a.line1);
  if (!line1) {
    errors.push({ field: 'shippingAddress.line1', message: 'line1 is required' });
  } else {
    if (line1.length > MAX_LENGTHS.line1) {
      errors.push({ field: 'shippingAddress.line1', message: `line1 must not exceed ${MAX_LENGTHS.line1} characters` });
    }
    if (hasControlChars(raw(a.line1))) {
      errors.push({ field: 'shippingAddress.line1', message: 'line1 contains invalid characters' });
    }
    if (containsHtml(line1)) {
      errors.push({ field: 'shippingAddress.line1', message: 'line1 must not contain HTML' });
    }
  }

  const line2 = sanitizeString(a.line2);
  if (line2 && line2.length > MAX_LENGTHS.line2) {
    errors.push({ field: 'shippingAddress.line2', message: `line2 must not exceed ${MAX_LENGTHS.line2} characters` });
  }
  if (line2 && hasControlChars(raw(a.line2))) {
    errors.push({ field: 'shippingAddress.line2', message: 'line2 contains invalid characters' });
  }

  const city = sanitizeString(a.city);
  if (!city) {
    errors.push({ field: 'shippingAddress.city', message: 'city is required' });
  } else {
    if (city.length > MAX_LENGTHS.city) {
      errors.push({ field: 'shippingAddress.city', message: `city must not exceed ${MAX_LENGTHS.city} characters` });
    }
    if (hasControlChars(raw(a.city))) {
      errors.push({ field: 'shippingAddress.city', message: 'city contains invalid characters' });
    }
    if (containsHtml(city)) {
      errors.push({ field: 'shippingAddress.city', message: 'city must not contain HTML' });
    }
  }

  const stateOrProvince = sanitizeString(a.stateOrProvince);
  if (!stateOrProvince) {
    errors.push({ field: 'shippingAddress.stateOrProvince', message: 'stateOrProvince is required' });
  } else {
    if (stateOrProvince.length > MAX_LENGTHS.stateOrProvince) {
      errors.push({ field: 'shippingAddress.stateOrProvince', message: `stateOrProvince must not exceed ${MAX_LENGTHS.stateOrProvince} characters` });
    }
  }

  const country = sanitizeString(a.country).toUpperCase();
  if (!country) {
    errors.push({ field: 'shippingAddress.country', message: 'country is required' });
  } else if (!isValidCountry(country)) {
    errors.push({ field: 'shippingAddress.country', message: `country must be one of: ${SUPPORTED_COUNTRIES.join(', ')}` });
  }

  const postalCode = sanitizeString(a.postalCode);
  if (!postalCode) {
    errors.push({ field: 'shippingAddress.postalCode', message: 'postalCode is required' });
  } else {
    if (postalCode.length > MAX_LENGTHS.postalCode) {
      errors.push({ field: 'shippingAddress.postalCode', message: `postalCode must not exceed ${MAX_LENGTHS.postalCode} characters` });
    }
    if (country && !isValidPostalCode(postalCode, country)) {
      errors.push({ field: 'shippingAddress.postalCode', message: `postalCode format invalid for ${country}` });
    }
  }

  const phone = sanitizeString(a.phone);
  if (phone) {
    if (phone.length > MAX_LENGTHS.phone) {
      errors.push({ field: 'shippingAddress.phone', message: `phone must not exceed ${MAX_LENGTHS.phone} characters` });
    } else if (!isValidPhone(phone)) {
      errors.push({ field: 'shippingAddress.phone', message: 'phone must contain at least 10 digits' });
    }
  }

  return errors;
}
