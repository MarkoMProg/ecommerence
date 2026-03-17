/**
 * DTO and validation for contact form (POST /api/v1/contact).
 * Matches frontend ContactForm constraints.
 */

import {
  sanitizeString,
  containsHtml,
  isValidEmail,
} from '../../common/sanitize';

export interface ContactDto {
  name: string;
  email: string;
  subject?: string;
  message: string;
}

const MAX_SUBJECT = 200;
const MAX_MESSAGE = 2000;

interface ValidationError {
  field: string;
  message: string;
}

export function validateContactDto(body: unknown): ValidationError[] {
  const errors: ValidationError[] = [];
  if (!body || typeof body !== 'object') {
    errors.push({ field: 'body', message: 'Request body is required' });
    return errors;
  }
  const b = body as Record<string, unknown>;

  const name = sanitizeString(b.name);
  if (!name || name.length < 2) {
    errors.push({
      field: 'name',
      message: 'Name must be at least 2 characters.',
    });
  } else if (containsHtml(name)) {
    errors.push({ field: 'name', message: 'Name cannot contain HTML.' });
  }

  const email = typeof b.email === 'string' ? b.email.trim() : '';
  if (!email) {
    errors.push({ field: 'email', message: 'Email is required.' });
  } else if (!isValidEmail(email)) {
    errors.push({
      field: 'email',
      message: 'Please enter a valid email address.',
    });
  }

  const subject = sanitizeString(b.subject);
  if (subject && subject.length > MAX_SUBJECT) {
    errors.push({
      field: 'subject',
      message: `Subject must be ${MAX_SUBJECT} characters or less.`,
    });
  } else if (subject && containsHtml(subject)) {
    errors.push({ field: 'subject', message: 'Subject cannot contain HTML.' });
  }

  const message = sanitizeString(b.message);
  if (!message || message.length < 10) {
    errors.push({
      field: 'message',
      message: 'Message must be at least 10 characters.',
    });
  } else if (message.length > MAX_MESSAGE) {
    errors.push({
      field: 'message',
      message: `Message must be ${MAX_MESSAGE} characters or less.`,
    });
  } else if (containsHtml(message)) {
    errors.push({ field: 'message', message: 'Message cannot contain HTML.' });
  }

  return errors;
}
