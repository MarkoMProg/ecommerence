/** DTO-style interfaces for auth endpoints. Validated manually since class-validator is not installed. */

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


const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface ValidationError {
  field: string;
  message: string;
}

export function validateRegister(body: any): ValidationError[] {
  const errors: ValidationError[] = [];

  if (
    !body?.name ||
    typeof body.name !== 'string' ||
    body.name.trim().length < 1
  ) {
    errors.push({ field: 'name', message: 'Name is required' });
  } else if (body.name.trim().length > 100) {
    errors.push({
      field: 'name',
      message: 'Name must not exceed 100 characters',
    });
  }

  if (!body?.email || typeof body.email !== 'string') {
    errors.push({ field: 'email', message: 'Email is required' });
  } else if (!EMAIL_RE.test(body.email)) {
    errors.push({
      field: 'email',
      message: 'Please enter a valid email address',
    });
  }

  if (!body?.password || typeof body.password !== 'string') {
    errors.push({ field: 'password', message: 'Password is required' });
  } else if (body.password.length < 8) {
    errors.push({
      field: 'password',
      message: 'Password must be at least 8 characters',
    });
  } else if (body.password.length > 128) {
    errors.push({
      field: 'password',
      message: 'Password must not exceed 128 characters',
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

  if (
    !body?.email ||
    typeof body.email !== 'string' ||
    !EMAIL_RE.test(body.email)
  ) {
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

  if (
    !body?.email ||
    typeof body.email !== 'string' ||
    !EMAIL_RE.test(body.email)
  ) {
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
  } else if (body.newPassword.length < 8) {
    errors.push({
      field: 'newPassword',
      message: 'Password must be at least 8 characters',
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
