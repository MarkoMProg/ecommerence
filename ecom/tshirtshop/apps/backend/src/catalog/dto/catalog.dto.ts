/** DTOs and validation for catalog endpoints. */

import {
  sanitizeString,
  sanitizeMultilineString,
  containsHtml,
  hasControlChars,
  isValidPriceCents,
  isValidStockQuantity,
  isValidImageUrl,
  MAX_PRICE_CENTS,
  MAX_STOCK_QUANTITY,
  MAX_PRODUCT_NAME_LENGTH,
  MAX_PRODUCT_DESCRIPTION_LENGTH,
} from '../../common/sanitize';

/** A single image entry with a URL. */
export interface ProductImageInput {
  url: string;
}

export interface CreateProductBody {
  name: string;
  description: string;
  priceCents: number;
  stockQuantity?: number;
  categoryId: string;
  brand: string;
  weightMetric?: string;
  weightImperial?: string;
  dimensionMetric?: string;
  dimensionImperial?: string;
  /** Comma-separated sizes, e.g. "XS,S,M,L,XL". Omit or null for products with no size selection. */
  sizeOptions?: string;
  /** e.g. "100% combed cotton, 320gsm" */
  material?: string;
  /** Apparel fit, e.g. "Oversized" */
  fit?: string;
  /** e.g. "Machine wash cold. Tumble dry low." */
  careInstructions?: string;
  /** Prints/posters: "Portrait" or "Landscape" */
  orientation?: string;
  /** Prints/posters: e.g. "Ships unframed" */
  framingInfo?: string;
  /** Images array: each item has a url and optional alt text. First image is primary. */
  images?: ProductImageInput[];
}

export interface UpdateProductBody {
  name?: string;
  description?: string;
  priceCents?: number;
  stockQuantity?: number;
  categoryId?: string;
  brand?: string;
  weightMetric?: string;
  weightImperial?: string;
  dimensionMetric?: string;
  dimensionImperial?: string;
  sizeOptions?: string;
  material?: string;
  fit?: string;
  careInstructions?: string;
  orientation?: string;
  framingInfo?: string;
  /** Soft-delete: hide from public storefront without losing data. */
  isArchived?: boolean;
  /** When provided, replaces all existing images for the product. */
  images?: ProductImageInput[];
}

export interface ValidationError {
  field: string;
  message: string;
}

/** Max brand name length. */
const MAX_BRAND_LENGTH = 100;
/** Max images per product. */
const MAX_IMAGES_PER_PRODUCT = 20;
/** Max length for optional text fields (material, fit, care, etc.). */
const MAX_OPTIONAL_TEXT_LENGTH = 500;
/** Allowed orientation values. */
const ALLOWED_ORIENTATIONS = ['portrait', 'landscape'] as const;

function validateStringField(
  b: Record<string, unknown>,
  field: string,
  maxLen: number,
  errors: ValidationError[],
  required: boolean,
): void {
  const raw = b[field];
  if (raw == null || raw === undefined) {
    if (required) errors.push({ field, message: `${field} is required` });
    return;
  }
  const val = sanitizeString(raw);
  if (required && !val) {
    errors.push({ field, message: `${field} is required` });
  } else if (val) {
    if (val.length > maxLen) {
      errors.push({ field, message: `${field} must not exceed ${maxLen} characters` });
    }
    if (hasControlChars(val)) {
      errors.push({ field, message: `${field} contains invalid characters` });
    }
    if (containsHtml(val)) {
      errors.push({ field, message: `${field} must not contain HTML` });
    }
  }
}

function validateImages(b: Record<string, unknown>, errors: ValidationError[]): void {
  if (b?.images == null) return;
  if (!Array.isArray(b.images)) {
    errors.push({ field: 'images', message: 'images must be an array' });
    return;
  }
  if (b.images.length > MAX_IMAGES_PER_PRODUCT) {
    errors.push({ field: 'images', message: `images must not exceed ${MAX_IMAGES_PER_PRODUCT} entries` });
    return;
  }
  for (const img of b.images as unknown[]) {
    const entry = img as Record<string, unknown>;
    if (!entry?.url || typeof entry.url !== 'string' || entry.url.trim().length < 1) {
      errors.push({ field: 'images', message: 'Each image must have a non-empty url string' });
      break;
    }
    if (!isValidImageUrl(entry.url.trim())) {
      errors.push({ field: 'images', message: 'Each image url must be a valid HTTP/HTTPS URL with an allowed image format' });
      break;
    }
  }
}

export function validateCreateProduct(body: unknown): ValidationError[] {
  const errors: ValidationError[] = [];
  const b = body as Record<string, unknown>;

  // Name: required, sanitized, max length, no HTML
  validateStringField(b, 'name', MAX_PRODUCT_NAME_LENGTH, errors, true);

  // Description: required, multiline allowed, max length
  if (!b?.description || typeof b.description !== 'string') {
    errors.push({ field: 'description', message: 'Description is required' });
  } else {
    const desc = sanitizeMultilineString(b.description);
    if (!desc) {
      errors.push({ field: 'description', message: 'Description is required' });
    } else if (desc.length > MAX_PRODUCT_DESCRIPTION_LENGTH) {
      errors.push({ field: 'description', message: `Description must not exceed ${MAX_PRODUCT_DESCRIPTION_LENGTH} characters` });
    } else if (containsHtml(desc)) {
      errors.push({ field: 'description', message: 'Description must not contain HTML' });
    }
  }

  // Price: required, semantic range check
  if (b?.priceCents == null || typeof b.priceCents !== 'number') {
    errors.push({ field: 'priceCents', message: 'priceCents is required and must be a number' });
  } else if (!isValidPriceCents(b.priceCents)) {
    errors.push({ field: 'priceCents', message: `priceCents must be a non-negative integer up to ${MAX_PRICE_CENTS}` });
  }

  // Category: required, must look like a UUID
  validateStringField(b, 'categoryId', 36, errors, true);

  // Brand: required, sanitized
  validateStringField(b, 'brand', MAX_BRAND_LENGTH, errors, true);

  // Stock: optional, semantic range check
  if (b?.stockQuantity != null) {
    if (typeof b.stockQuantity !== 'number' || !isValidStockQuantity(b.stockQuantity)) {
      errors.push({ field: 'stockQuantity', message: `stockQuantity must be a non-negative integer up to ${MAX_STOCK_QUANTITY}` });
    }
  }

  // Optional text fields: sanitize and limit length
  for (const field of ['weightMetric', 'weightImperial', 'dimensionMetric', 'dimensionImperial', 'material', 'fit', 'careInstructions', 'framingInfo', 'sizeOptions'] as const) {
    if (b?.[field] != null) {
      validateStringField(b, field, MAX_OPTIONAL_TEXT_LENGTH, errors, false);
    }
  }

  // Orientation: whitelist
  if (b?.orientation != null) {
    const orientation = sanitizeString(b.orientation).toLowerCase();
    if (orientation && !ALLOWED_ORIENTATIONS.includes(orientation as typeof ALLOWED_ORIENTATIONS[number])) {
      errors.push({ field: 'orientation', message: `orientation must be one of: ${ALLOWED_ORIENTATIONS.join(', ')}` });
    }
  }

  // Images: validate URLs
  validateImages(b, errors);

  return errors;
}

export function validateUpdateProduct(body: unknown): ValidationError[] {
  const errors: ValidationError[] = [];
  const b = body as Record<string, unknown>;

  if (b?.name != null) {
    validateStringField(b, 'name', MAX_PRODUCT_NAME_LENGTH, errors, false);
    const name = sanitizeString(b.name);
    if (typeof b.name === 'string' && !name) {
      errors.push({ field: 'name', message: 'Name must be a non-empty string' });
    }
  }

  if (b?.description != null) {
    if (typeof b.description !== 'string') {
      errors.push({ field: 'description', message: 'Description must be a string' });
    } else {
      const desc = sanitizeMultilineString(b.description);
      if (desc.length > MAX_PRODUCT_DESCRIPTION_LENGTH) {
        errors.push({ field: 'description', message: `Description must not exceed ${MAX_PRODUCT_DESCRIPTION_LENGTH} characters` });
      } else if (containsHtml(desc)) {
        errors.push({ field: 'description', message: 'Description must not contain HTML' });
      }
    }
  }

  if (b?.priceCents != null) {
    if (typeof b.priceCents !== 'number' || !isValidPriceCents(b.priceCents)) {
      errors.push({ field: 'priceCents', message: `priceCents must be a non-negative integer up to ${MAX_PRICE_CENTS}` });
    }
  }

  if (b?.stockQuantity != null) {
    if (typeof b.stockQuantity !== 'number' || !isValidStockQuantity(b.stockQuantity)) {
      errors.push({ field: 'stockQuantity', message: `stockQuantity must be a non-negative integer up to ${MAX_STOCK_QUANTITY}` });
    }
  }

  if (b?.categoryId != null) {
    validateStringField(b, 'categoryId', 36, errors, false);
    const catId = sanitizeString(b.categoryId);
    if (typeof b.categoryId === 'string' && !catId) {
      errors.push({ field: 'categoryId', message: 'categoryId must be a non-empty string' });
    }
  }

  if (b?.brand != null) {
    validateStringField(b, 'brand', MAX_BRAND_LENGTH, errors, false);
    const brand = sanitizeString(b.brand);
    if (typeof b.brand === 'string' && !brand) {
      errors.push({ field: 'brand', message: 'Brand must be a non-empty string' });
    }
  }

  for (const field of ['weightMetric', 'weightImperial', 'dimensionMetric', 'dimensionImperial', 'material', 'fit', 'careInstructions', 'framingInfo', 'sizeOptions'] as const) {
    if (b?.[field] != null) {
      validateStringField(b, field, MAX_OPTIONAL_TEXT_LENGTH, errors, false);
    }
  }

  if (b?.orientation != null) {
    const orientation = sanitizeString(b.orientation).toLowerCase();
    if (orientation && !ALLOWED_ORIENTATIONS.includes(orientation as typeof ALLOWED_ORIENTATIONS[number])) {
      errors.push({ field: 'orientation', message: `orientation must be one of: ${ALLOWED_ORIENTATIONS.join(', ')}` });
    }
  }

  validateImages(b, errors);

  return errors;
}
