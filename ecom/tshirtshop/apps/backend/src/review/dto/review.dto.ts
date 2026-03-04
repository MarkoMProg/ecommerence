/** DTOs and validation for review endpoints (REV-002). */

export interface CreateReviewBody {
  rating: number;
  title?: string;
  body: string;
}

export interface UpdateReviewBody {
  rating?: number;
  title?: string;
  body?: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validate payload for creating a review.
 * Returns an empty array when valid.
 */
export function validateCreateReview(body: unknown): ValidationError[] {
  const errors: ValidationError[] = [];
  const b = body as Record<string, unknown>;

  if (b?.rating == null || typeof b.rating !== 'number') {
    errors.push({ field: 'rating', message: 'Rating is required and must be a number' });
  } else if (!Number.isInteger(b.rating) || b.rating < 1 || b.rating > 5) {
    errors.push({ field: 'rating', message: 'Rating must be an integer between 1 and 5' });
  }

  if (b?.title != null) {
    if (typeof b.title !== 'string') {
      errors.push({ field: 'title', message: 'Title must be a string' });
    } else if (b.title.length > 255) {
      errors.push({ field: 'title', message: 'Title must not exceed 255 characters' });
    }
  }

  if (!b?.body || typeof b.body !== 'string' || b.body.trim().length < 1) {
    errors.push({ field: 'body', message: 'Review body is required' });
  } else if (b.body.length > 5000) {
    errors.push({ field: 'body', message: 'Review body must not exceed 5000 characters' });
  }

  return errors;
}

/**
 * Validate payload for updating a review.
 * At least one field must be present.
 */
export function validateUpdateReview(body: unknown): ValidationError[] {
  const errors: ValidationError[] = [];
  const b = body as Record<string, unknown>;

  const hasField = b?.rating != null || b?.title != null || b?.body != null;
  if (!hasField) {
    errors.push({ field: '_', message: 'At least one field (rating, title, body) must be provided' });
    return errors;
  }

  if (b?.rating != null) {
    if (typeof b.rating !== 'number') {
      errors.push({ field: 'rating', message: 'Rating must be a number' });
    } else if (!Number.isInteger(b.rating) || b.rating < 1 || b.rating > 5) {
      errors.push({ field: 'rating', message: 'Rating must be an integer between 1 and 5' });
    }
  }

  if (b?.title != null) {
    if (typeof b.title !== 'string') {
      errors.push({ field: 'title', message: 'Title must be a string' });
    } else if (b.title.length > 255) {
      errors.push({ field: 'title', message: 'Title must not exceed 255 characters' });
    }
  }

  if (b?.body != null) {
    if (typeof b.body !== 'string' || b.body.trim().length < 1) {
      errors.push({ field: 'body', message: 'Review body must be a non-empty string' });
    } else if (b.body.length > 5000) {
      errors.push({ field: 'body', message: 'Review body must not exceed 5000 characters' });
    }
  }

  return errors;
}
