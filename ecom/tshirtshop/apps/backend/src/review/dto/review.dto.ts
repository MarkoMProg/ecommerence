/** DTOs and validation for review endpoints (REV-002). */

import {
  sanitizeString,
  sanitizeMultilineString,
  containsHtml,
  hasControlChars,
  isValidRating,
  MAX_REVIEW_BODY_LENGTH,
  MAX_REVIEW_TITLE_LENGTH,
} from '../../common/sanitize';

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

  // Rating: required, integer 1–5
  if (b?.rating == null || typeof b.rating !== 'number') {
    errors.push({
      field: 'rating',
      message: 'Rating is required and must be a number',
    });
  } else if (!isValidRating(b.rating)) {
    errors.push({
      field: 'rating',
      message: 'Rating must be an integer between 1 and 5',
    });
  }

  // Title: optional, sanitized, max length, no HTML
  if (b?.title != null) {
    if (typeof b.title !== 'string') {
      errors.push({ field: 'title', message: 'Title must be a string' });
    } else {
      const title = sanitizeString(b.title);
      if (title.length > MAX_REVIEW_TITLE_LENGTH) {
        errors.push({
          field: 'title',
          message: `Title must not exceed ${MAX_REVIEW_TITLE_LENGTH} characters`,
        });
      }
      if (hasControlChars(b.title)) {
        errors.push({
          field: 'title',
          message: 'Title contains invalid characters',
        });
      }
      if (containsHtml(title)) {
        errors.push({ field: 'title', message: 'Title must not contain HTML' });
      }
    }
  }

  // Body: required, multiline, max length, no HTML
  if (!b?.body || typeof b.body !== 'string' || b.body.trim().length < 1) {
    errors.push({ field: 'body', message: 'Review body is required' });
  } else {
    const bodyText = sanitizeMultilineString(b.body);
    if (bodyText.length > MAX_REVIEW_BODY_LENGTH) {
      errors.push({
        field: 'body',
        message: `Review body must not exceed ${MAX_REVIEW_BODY_LENGTH} characters`,
      });
    }
    if (containsHtml(bodyText)) {
      errors.push({
        field: 'body',
        message: 'Review body must not contain HTML',
      });
    }
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
    errors.push({
      field: '_',
      message: 'At least one field (rating, title, body) must be provided',
    });
    return errors;
  }

  if (b?.rating != null) {
    if (typeof b.rating !== 'number') {
      errors.push({ field: 'rating', message: 'Rating must be a number' });
    } else if (!isValidRating(b.rating)) {
      errors.push({
        field: 'rating',
        message: 'Rating must be an integer between 1 and 5',
      });
    }
  }

  if (b?.title != null) {
    if (typeof b.title !== 'string') {
      errors.push({ field: 'title', message: 'Title must be a string' });
    } else {
      const title = sanitizeString(b.title);
      if (title.length > MAX_REVIEW_TITLE_LENGTH) {
        errors.push({
          field: 'title',
          message: `Title must not exceed ${MAX_REVIEW_TITLE_LENGTH} characters`,
        });
      }
      if (containsHtml(title)) {
        errors.push({ field: 'title', message: 'Title must not contain HTML' });
      }
    }
  }

  if (b?.body != null) {
    if (typeof b.body !== 'string' || b.body.trim().length < 1) {
      errors.push({
        field: 'body',
        message: 'Review body must be a non-empty string',
      });
    } else {
      const bodyText = sanitizeMultilineString(b.body);
      if (bodyText.length > MAX_REVIEW_BODY_LENGTH) {
        errors.push({
          field: 'body',
          message: `Review body must not exceed ${MAX_REVIEW_BODY_LENGTH} characters`,
        });
      }
      if (containsHtml(bodyText)) {
        errors.push({
          field: 'body',
          message: 'Review body must not contain HTML',
        });
      }
    }
  }

  return errors;
}
