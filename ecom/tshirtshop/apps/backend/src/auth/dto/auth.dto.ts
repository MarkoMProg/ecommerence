/** DTO-style interfaces for auth endpoints. Validated manually since class-validator is not installed. */

import {
  sanitizeString,
  isValidEmail,
  hasControlChars,
  containsHtml,
} from '../../common/sanitize';

export interface RegisterDto {
  name: string;
  email: string;
  password: string;
  captchaToken: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface Verify2faDto {
  code: string;
}

export interface ForgotPasswordDto {
  email: string;
}

export interface ResetPasswordDto {
  newPassword: string;
  token: string;
}

/** Refresh token comes from httpOnly cookie — no body required */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- marker type for no-body endpoint
export interface RefreshTokenDto {}

export interface ValidationError {
  field: string;
  message: string;
}

/** Max name length. */
const MAX_NAME_LENGTH = 100;
/** Max email length (RFC 5321). */
const MAX_EMAIL_LENGTH = 254;
/** Min / max password length. */
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;

export function validateRegister(body: unknown): ValidationError[] {
  const errors: ValidationError[] = [];
  const b = body as Record<string, unknown> | null | undefined;
  if (!b || typeof b !== 'object')
    return [{ field: 'body', message: 'Invalid request body' }];

  const rawName = typeof b.name === 'string' ? b.name : '';
  const name = sanitizeString(b.name);
  if (!name) {
    errors.push({ field: 'name', message: 'Name is required' });
  } else if (name.length > MAX_NAME_LENGTH) {
    errors.push({
      field: 'name',
      message: `Name must not exceed ${MAX_NAME_LENGTH} characters`,
    });
  } else if (hasControlChars(rawName)) {
    errors.push({ field: 'name', message: 'Name contains invalid characters' });
  } else if (containsHtml(name)) {
    errors.push({ field: 'name', message: 'Name must not contain HTML' });
  }

  const email = sanitizeString(b.email).toLowerCase();
  if (!email) {
    errors.push({ field: 'email', message: 'Email is required' });
  } else if (email.length > MAX_EMAIL_LENGTH) {
    errors.push({
      field: 'email',
      message: `Email must not exceed ${MAX_EMAIL_LENGTH} characters`,
    });
  } else if (!isValidEmail(email)) {
    errors.push({
      field: 'email',
      message: 'Please enter a valid email address',
    });
  }

  if (!b.password || typeof b.password !== 'string') {
    errors.push({ field: 'password', message: 'Password is required' });
  } else if (b.password.length < MIN_PASSWORD_LENGTH) {
    errors.push({
      field: 'password',
      message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
    });
  } else if (b.password.length > MAX_PASSWORD_LENGTH) {
    errors.push({
      field: 'password',
      message: `Password must not exceed ${MAX_PASSWORD_LENGTH} characters`,
    });
  } else if (!/[A-Z]/.test(b.password)) {
    errors.push({
      field: 'password',
      message: 'Password must contain at least one uppercase letter',
    });
  } else if (!/[a-z]/.test(b.password)) {
    errors.push({
      field: 'password',
      message: 'Password must contain at least one lowercase letter',
    });
  } else if (!/\d/.test(b.password)) {
    errors.push({
      field: 'password',
      message: 'Password must contain at least one number',
    });
  } else if (hasControlChars(b.password)) {
    errors.push({
      field: 'password',
      message: 'Password contains invalid characters',
    });
  } else if (containsHtml(b.password)) {
    errors.push({
      field: 'password',
      message: 'Password must not contain HTML',
    });
  }

  const captchaToken =
    typeof b.captchaToken === 'string' ? b.captchaToken.trim() : '';
  if (!captchaToken) {
    errors.push({
      field: 'captchaToken',
      message: 'Please complete the CAPTCHA',
    });
  }

  return errors;
}

function toBody(b: unknown): Record<string, unknown> | null {
  if (!b || typeof b !== 'object') return null;
  return b as Record<string, unknown>;
}

export function validateLogin(body: unknown): ValidationError[] {
  const errors: ValidationError[] = [];
  const b = toBody(body);
  if (!b) return [{ field: 'body', message: 'Invalid request body' }];

  const email = sanitizeString(b.email).toLowerCase();
  if (!email || !isValidEmail(email)) {
    errors.push({
      field: 'email',
      message: 'Please enter a valid email address',
    });
  }

  if (!b.password || typeof b.password !== 'string' || b.password.length < 1) {
    errors.push({ field: 'password', message: 'Password is required' });
  }

  return errors;
}

export function validateForgotPassword(body: unknown): ValidationError[] {
  const errors: ValidationError[] = [];
  const b = toBody(body);
  if (!b) return [{ field: 'body', message: 'Invalid request body' }];

  const email = sanitizeString(b.email).toLowerCase();
  if (!email || !isValidEmail(email)) {
    errors.push({
      field: 'email',
      message: 'Please enter a valid email address',
    });
  }

  return errors;
}

export function validateResetPassword(body: unknown): ValidationError[] {
  const errors: ValidationError[] = [];
  const b = toBody(body);
  if (!b) return [{ field: 'body', message: 'Invalid request body' }];

  if (!b.token || typeof b.token !== 'string') {
    errors.push({ field: 'token', message: 'Reset token is required' });
  }

  if (!b.newPassword || typeof b.newPassword !== 'string') {
    errors.push({ field: 'newPassword', message: 'New password is required' });
  } else if (b.newPassword.length < MIN_PASSWORD_LENGTH) {
    errors.push({
      field: 'newPassword',
      message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
    });
  } else if (b.newPassword.length > MAX_PASSWORD_LENGTH) {
    errors.push({
      field: 'newPassword',
      message: `Password must not exceed ${MAX_PASSWORD_LENGTH} characters`,
    });
  } else if (!/[A-Z]/.test(b.newPassword)) {
    errors.push({
      field: 'newPassword',
      message: 'Password must contain at least one uppercase letter',
    });
  } else if (!/[a-z]/.test(b.newPassword)) {
    errors.push({
      field: 'newPassword',
      message: 'Password must contain at least one lowercase letter',
    });
  } else if (!/\d/.test(b.newPassword)) {
    errors.push({
      field: 'newPassword',
      message: 'Password must contain at least one number',
    });
  }

  return errors;
}

export function validateVerify2fa(body: unknown): ValidationError[] {
  const errors: ValidationError[] = [];
  const b = toBody(body);
  if (!b) return [{ field: 'code', message: 'Invalid request body' }];

  if (!b.code || typeof b.code !== 'string') {
    errors.push({ field: 'code', message: 'Verification code is required' });
  } else if (!/^\d{6}$/.test(b.code)) {
    errors.push({ field: 'code', message: 'Code must be a 6-digit number' });
  }

  return errors;
}
