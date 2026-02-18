/** DTOs and validation for catalog endpoints. */

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
  imageUrls?: string[];
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
}

export interface ValidationError {
  field: string;
  message: string;
}

export function validateCreateProduct(body: unknown): ValidationError[] {
  const errors: ValidationError[] = [];
  const b = body as Record<string, unknown>;

  if (!b?.name || typeof b.name !== 'string' || b.name.trim().length < 1) {
    errors.push({ field: 'name', message: 'Name is required' });
  } else if (b.name.length > 255) {
    errors.push({ field: 'name', message: 'Name must not exceed 255 characters' });
  }

  if (!b?.description || typeof b.description !== 'string') {
    errors.push({ field: 'description', message: 'Description is required' });
  }

  if (b?.priceCents == null || typeof b.priceCents !== 'number') {
    errors.push({ field: 'priceCents', message: 'priceCents is required and must be a number' });
  } else if (b.priceCents < 0) {
    errors.push({ field: 'priceCents', message: 'priceCents must be non-negative' });
  }

  if (!b?.categoryId || typeof b.categoryId !== 'string' || b.categoryId.trim().length < 1) {
    errors.push({ field: 'categoryId', message: 'categoryId is required' });
  }

  if (!b?.brand || typeof b.brand !== 'string' || b.brand.trim().length < 1) {
    errors.push({ field: 'brand', message: 'Brand is required' });
  }

  if (b?.stockQuantity != null) {
    if (typeof b.stockQuantity !== 'number' || b.stockQuantity < 0) {
      errors.push({ field: 'stockQuantity', message: 'stockQuantity must be a non-negative number' });
    }
  }

  if (b?.imageUrls != null) {
    if (!Array.isArray(b.imageUrls)) {
      errors.push({ field: 'imageUrls', message: 'imageUrls must be an array' });
    } else if (b.imageUrls.some((u: unknown) => typeof u !== 'string')) {
      errors.push({ field: 'imageUrls', message: 'imageUrls must contain only strings' });
    }
  }

  return errors;
}

export function validateUpdateProduct(body: unknown): ValidationError[] {
  const errors: ValidationError[] = [];
  const b = body as Record<string, unknown>;

  if (b?.name != null) {
    if (typeof b.name !== 'string' || b.name.trim().length < 1) {
      errors.push({ field: 'name', message: 'Name must be a non-empty string' });
    } else if (b.name.length > 255) {
      errors.push({ field: 'name', message: 'Name must not exceed 255 characters' });
    }
  }

  if (b?.description != null && typeof b.description !== 'string') {
    errors.push({ field: 'description', message: 'Description must be a string' });
  }

  if (b?.priceCents != null) {
    if (typeof b.priceCents !== 'number' || b.priceCents < 0) {
      errors.push({ field: 'priceCents', message: 'priceCents must be a non-negative number' });
    }
  }

  if (b?.stockQuantity != null) {
    if (typeof b.stockQuantity !== 'number' || b.stockQuantity < 0) {
      errors.push({ field: 'stockQuantity', message: 'stockQuantity must be a non-negative number' });
    }
  }

  if (b?.categoryId != null && (typeof b.categoryId !== 'string' || b.categoryId.trim().length < 1)) {
    errors.push({ field: 'categoryId', message: 'categoryId must be a non-empty string' });
  }

  if (b?.brand != null && (typeof b.brand !== 'string' || b.brand.trim().length < 1)) {
    errors.push({ field: 'brand', message: 'Brand must be a non-empty string' });
  }

  return errors;
}
