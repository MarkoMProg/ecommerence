/** DTOs and validation for cart endpoints */

export interface AddCartItemBody {
  productId: string;
  quantity?: number;
}

export interface ValidationError {
  field: string;
  message: string;
}

export function validateAddCartItem(body: unknown): ValidationError[] {
  const errors: ValidationError[] = [];
  const b = body as Record<string, unknown>;

  if (!b?.productId || typeof b.productId !== 'string' || b.productId.trim().length < 1) {
    errors.push({ field: 'productId', message: 'productId is required' });
  }

  if (b?.quantity != null) {
    if (typeof b.quantity !== 'number' || b.quantity < 1) {
      errors.push({ field: 'quantity', message: 'quantity must be a positive number' });
    }
  }

  return errors;
}

export interface UpdateCartItemQuantityBody {
  quantity: number;
}

export function validateUpdateQuantity(body: unknown): ValidationError[] {
  const errors: ValidationError[] = [];
  const b = body as Record<string, unknown>;

  if (b?.quantity == null || typeof b.quantity !== 'number') {
    errors.push({ field: 'quantity', message: 'quantity is required and must be a number' });
  } else if (b.quantity < 0) {
    errors.push({ field: 'quantity', message: 'quantity must be non-negative' });
  }

  return errors;
}
