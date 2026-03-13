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

export interface RefreshTokenDto {
  // refresh token comes from httpOnly cookie — no body required
}

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

export function validateRegister(body: any): ValidationError[] {
  const errors: ValidationError[] = [];

  const rawName = typeof body?.name === 'string' ? body.name : '';
  const name = sanitizeString(body?.name);
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

  const email = sanitizeString(body?.email).toLowerCase();
  if (!email) {
    errors.push({ field: 'email', message: 'Email is required' });
  } else if (email.length > MAX_EMAIL_LENGTH) {
    errors.push({ field: 'email', message: `Email must not exceed ${MAX_EMAIL_LENGTH} characters` });
  } else if (!isValidEmail(email)) {
    errors.push({
      field: 'email',
      message: 'Please enter a valid email address',
    });
  }

  if (!body?.password || typeof body.password !== 'string') {
    errors.push({ field: 'password', message: 'Password is required' });
  } else if (body.password.length < MIN_PASSWORD_LENGTH) {
    errors.push({
      field: 'password',
      message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
    });
  } else if (body.password.length > MAX_PASSWORD_LENGTH) {
    errors.push({
      field: 'password',
      message: `Password must not exceed ${MAX_PASSWORD_LENGTH} characters`,
    });
  } else if (!/[A-Z]/.test(body.password)) {
    errors.push({
      field: 'password',
      message: 'Password must contain at least one uppercase letter',
    });
  } else if (!/[a-z]/.test(body.password)) {
    errors.push({
      field: 'password',
      message: 'Password must contain at least one lowercase letter',
    });
  } else if (!/\d/.test(body.password)) {
    errors.push({
      field: 'password',
      message: 'Password must contain at least one number',
    });
  }

  if (!body?.captchaToken || typeof body.captchaToken !== 'string') {
    errors.push({
      field: 'captchaToken',
      message: 'Please complete the CAPTCHA',
    });
  }

  return errors;
}

export function validateLogin(body: any): ValidationError[] {
  const errors: ValidationError[] = [];

  const email = sanitizeString(body?.email).toLowerCase();
  if (!email || !isValidEmail(email)) {
    errors.push({
      field: 'email',
      message: 'Please enter a valid email address',
    });
  }

  if (
    !body?.password ||
    typeof body.password !== 'string' ||
    body.password.length < 1
  ) {
    errors.push({ field: 'password', message: 'Password is required' });
  }

  return errors;
}

export function validateForgotPassword(body: any): ValidationError[] {
  const errors: ValidationError[] = [];

  const email = sanitizeString(body?.email).toLowerCase();
  if (!email || !isValidEmail(email)) {
    errors.push({
      field: 'email',
      message: 'Please enter a valid email address',
    });
  }

  return errors;
}

export function validateResetPassword(body: any): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!body?.token || typeof body.token !== 'string') {
    errors.push({ field: 'token', message: 'Reset token is required' });
  }

  if (!body?.newPassword || typeof body.newPassword !== 'string') {
    errors.push({ field: 'newPassword', message: 'New password is required' });
  } else if (body.newPassword.length < MIN_PASSWORD_LENGTH) {
    errors.push({
      field: 'newPassword',
      message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
    });
  } else if (body.newPassword.length > MAX_PASSWORD_LENGTH) {
    errors.push({
      field: 'newPassword',
      message: `Password must not exceed ${MAX_PASSWORD_LENGTH} characters`,
    });
  } else if (!/[A-Z]/.test(body.newPassword)) {
    errors.push({
      field: 'newPassword',
      message: 'Password must contain at least one uppercase letter',
    });
  } else if (!/[a-z]/.test(body.newPassword)) {
    errors.push({
      field: 'newPassword',
      message: 'Password must contain at least one lowercase letter',
    });
  } else if (!/\d/.test(body.newPassword)) {
    errors.push({
      field: 'newPassword',
      message: 'Password must contain at least one number',
    });
  }

  return errors;
}

export function validateVerify2fa(body: any): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!body?.code || typeof body.code !== 'string') {
    errors.push({ field: 'code', message: 'Verification code is required' });
  } else if (!/^\d{6}$/.test(body.code)) {
    errors.push({ field: 'code', message: 'Code must be a 6-digit number' });
  }

  return errors;
}
