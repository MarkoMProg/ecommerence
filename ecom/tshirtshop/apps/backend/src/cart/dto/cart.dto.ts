/** DTOs and validation for cart endpoints */

import { MAX_CART_ITEM_QUANTITY } from '../../common/sanitize';

export interface AddCartItemBody {
  productId: string;
  quantity?: number;
  /** Selected option for this line item, e.g. size "M". Optional. */
  selectedOption?: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

export function validateAddCartItem(body: unknown): ValidationError[] {
  const errors: ValidationError[] = [];
  const b = body as Record<string, unknown>;

  if (
    !b?.productId ||
    typeof b.productId !== 'string' ||
    b.productId.trim().length < 1
  ) {
    errors.push({ field: 'productId', message: 'productId is required' });
  }

  if (b?.quantity != null) {
    if (
      typeof b.quantity !== 'number' ||
      !Number.isInteger(b.quantity) ||
      b.quantity < 1
    ) {
      errors.push({
        field: 'quantity',
        message: 'quantity must be a positive integer',
      });
    } else if (b.quantity > MAX_CART_ITEM_QUANTITY) {
      errors.push({
        field: 'quantity',
        message: `quantity must not exceed ${MAX_CART_ITEM_QUANTITY}`,
      });
    }
  }

  if (b?.selectedOption != null) {
    if (typeof b.selectedOption !== 'string') {
      errors.push({
        field: 'selectedOption',
        message: 'selectedOption must be a string',
      });
    } else if (b.selectedOption.trim().length > 50) {
      errors.push({
        field: 'selectedOption',
        message: 'selectedOption must not exceed 50 characters',
      });
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
    errors.push({
      field: 'quantity',
      message: 'quantity is required and must be a number',
    });
  } else if (!Number.isInteger(b.quantity) || b.quantity < 0) {
    errors.push({
      field: 'quantity',
      message: 'quantity must be a non-negative integer',
    });
  } else if (b.quantity > MAX_CART_ITEM_QUANTITY) {
    errors.push({
      field: 'quantity',
      message: `quantity must not exceed ${MAX_CART_ITEM_QUANTITY}`,
    });
  }

  return errors;
}
