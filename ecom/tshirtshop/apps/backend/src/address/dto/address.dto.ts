/** DTOs and validation for user address endpoints (ADDR-001) */

export interface CreateAddressDto {
  label?: string;
  fullName: string;
  phone?: string;
  line1: string;
  line2?: string;
  city: string;
  stateOrRegion: string;
  postalCode: string;
  country: string;
  isDefaultShipping?: boolean;
  isDefaultBilling?: boolean;
}

export type UpdateAddressDto = Partial<CreateAddressDto>;

interface ValidationError {
  field: string;
  message: string;
}

/** Supported shipping countries — must stay in sync with checkout.dto.ts */
const SUPPORTED_COUNTRIES = [
  'EE', 'LV', 'LT', 'FI', 'SE', 'NO', 'DK', 'DE', 'FR', 'NL', 'BE', 'PL', 'ES', 'IT', 'AT', 'IE', 'PT',
  'CZ', 'GR', 'RO', 'HU', 'BG', 'HR', 'SK', 'SI', 'LU', 'CY', 'MT', 'GB', 'US', 'CA', 'CH', 'IS',
] as const;

const MAX_LENGTHS = {
  label: 50,
  fullName: 200,
  line1: 255,
  line2: 255,
  city: 100,
  stateOrRegion: 100,
  postalCode: 20,
  phone: 30,
} as const;

function hasControlChars(s: string): boolean {
  return /[\x00-\x1f\x7f]/.test(s);
}

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

/**
 * Validate a CreateAddressDto body.
 * @param partial If true, only fields that are present in the body are validated (for PATCH).
 */
export function validateAddressDto(body: unknown, partial = false): ValidationError[] {
  const errors: ValidationError[] = [];
  if (!body || typeof body !== 'object') {
    errors.push({ field: 'body', message: 'Request body is required' });
    return errors;
  }
  const b = body as Record<string, unknown>;

  // label: optional, max 50 chars
  if (b.label !== undefined || !partial) {
    const label = str(b.label);
    if (label && label.length > MAX_LENGTHS.label) {
      errors.push({ field: 'label', message: `label must not exceed ${MAX_LENGTHS.label} characters` });
    }
    if (label && hasControlChars(label)) {
      errors.push({ field: 'label', message: 'label contains invalid characters' });
    }
  }

  // fullName: required on create
  if (b.fullName !== undefined || !partial) {
    const fullName = str(b.fullName);
    if (!partial && !fullName) {
      errors.push({ field: 'fullName', message: 'fullName is required' });
    } else if (fullName) {
      if (fullName.length > MAX_LENGTHS.fullName) {
        errors.push({ field: 'fullName', message: `fullName must not exceed ${MAX_LENGTHS.fullName} characters` });
      }
      if (hasControlChars(fullName)) {
        errors.push({ field: 'fullName', message: 'fullName contains invalid characters' });
      }
    }
  }

  // line1: required on create
  if (b.line1 !== undefined || !partial) {
    const line1 = str(b.line1);
    if (!partial && !line1) {
      errors.push({ field: 'line1', message: 'line1 is required' });
    } else if (line1) {
      if (line1.length > MAX_LENGTHS.line1) {
        errors.push({ field: 'line1', message: `line1 must not exceed ${MAX_LENGTHS.line1} characters` });
      }
      if (hasControlChars(line1)) {
        errors.push({ field: 'line1', message: 'line1 contains invalid characters' });
      }
    }
  }

  // line2: optional
  if (b.line2 !== undefined) {
    const line2 = str(b.line2);
    if (line2 && line2.length > MAX_LENGTHS.line2) {
      errors.push({ field: 'line2', message: `line2 must not exceed ${MAX_LENGTHS.line2} characters` });
    }
    if (line2 && hasControlChars(line2)) {
      errors.push({ field: 'line2', message: 'line2 contains invalid characters' });
    }
  }

  // city: required on create
  if (b.city !== undefined || !partial) {
    const city = str(b.city);
    if (!partial && !city) {
      errors.push({ field: 'city', message: 'city is required' });
    } else if (city) {
      if (city.length > MAX_LENGTHS.city) {
        errors.push({ field: 'city', message: `city must not exceed ${MAX_LENGTHS.city} characters` });
      }
      if (hasControlChars(city)) {
        errors.push({ field: 'city', message: 'city contains invalid characters' });
      }
    }
  }

  // stateOrRegion: required on create
  if (b.stateOrRegion !== undefined || !partial) {
    const stateOrRegion = str(b.stateOrRegion);
    if (!partial && !stateOrRegion) {
      errors.push({ field: 'stateOrRegion', message: 'stateOrRegion is required' });
    } else if (stateOrRegion && stateOrRegion.length > MAX_LENGTHS.stateOrRegion) {
      errors.push({ field: 'stateOrRegion', message: `stateOrRegion must not exceed ${MAX_LENGTHS.stateOrRegion} characters` });
    }
  }

  // country: required on create
  if (b.country !== undefined || !partial) {
    const country = str(b.country).toUpperCase();
    if (!partial && !country) {
      errors.push({ field: 'country', message: 'country is required' });
    } else if (country && !SUPPORTED_COUNTRIES.includes(country as (typeof SUPPORTED_COUNTRIES)[number])) {
      errors.push({ field: 'country', message: `country must be one of: ${SUPPORTED_COUNTRIES.join(', ')}` });
    }
  }

  // postalCode: required on create
  if (b.postalCode !== undefined || !partial) {
    const postalCode = str(b.postalCode);
    if (!partial && !postalCode) {
      errors.push({ field: 'postalCode', message: 'postalCode is required' });
    } else if (postalCode && postalCode.length > MAX_LENGTHS.postalCode) {
      errors.push({ field: 'postalCode', message: `postalCode must not exceed ${MAX_LENGTHS.postalCode} characters` });
    }
  }

  // phone: optional, format check if provided
  if (b.phone !== undefined) {
    const phone = str(b.phone);
    if (phone) {
      const PHONE_PATTERN = /^[+\s\-()\d]{10,30}$/;
      if (!PHONE_PATTERN.test(phone)) {
        errors.push({ field: 'phone', message: 'phone format invalid' });
      } else {
        const digitCount = (phone.match(/\d/g) ?? []).length;
        if (digitCount < 10) {
          errors.push({ field: 'phone', message: 'phone must contain at least 10 digits' });
        }
      }
    }
  }

  // isDefaultShipping / isDefaultBilling: must be boolean if provided
  if (b.isDefaultShipping !== undefined && typeof b.isDefaultShipping !== 'boolean') {
    errors.push({ field: 'isDefaultShipping', message: 'isDefaultShipping must be a boolean' });
  }
  if (b.isDefaultBilling !== undefined && typeof b.isDefaultBilling !== 'boolean') {
    errors.push({ field: 'isDefaultBilling', message: 'isDefaultBilling must be a boolean' });
  }

  return errors;
}
