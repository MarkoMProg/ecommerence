import {
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
  validateVerify2fa,
} from '../dto/auth.dto';

describe('Auth DTO Validators', () => {
  describe('validateRegister', () => {
    it('should return no errors for valid input', () => {
      const errors = validateRegister({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password1',
        captchaToken: 'valid-token',
      });
      expect(errors).toHaveLength(0);
    });

    it('should error on missing name', () => {
      const errors = validateRegister({
        email: 'test@example.com',
        password: 'Password1',
        captchaToken: 'valid',
      });
      expect(errors.some((e) => e.field === 'name')).toBe(true);
    });

    it('should error on invalid email', () => {
      const errors = validateRegister({
        name: 'Test',
        email: 'not-an-email',
        password: 'Password1',
        captchaToken: 'valid',
      });
      expect(errors.some((e) => e.field === 'email')).toBe(true);
    });

    it('should error on short password', () => {
      const errors = validateRegister({
        name: 'Test',
        email: 'test@example.com',
        password: 'Ab1',
        captchaToken: 'valid',
      });
      expect(errors.some((e) => e.field === 'password')).toBe(true);
    });

    it('should error on password without uppercase', () => {
      const errors = validateRegister({
        name: 'Test',
        email: 'test@example.com',
        password: 'password1',
        captchaToken: 'valid',
      });
      expect(errors.some((e) => e.field === 'password')).toBe(true);
    });

    it('should error on password without lowercase', () => {
      const errors = validateRegister({
        name: 'Test',
        email: 'test@example.com',
        password: 'PASSWORD1',
        captchaToken: 'valid',
      });
      expect(errors.some((e) => e.field === 'password')).toBe(true);
    });

    it('should error on password without number', () => {
      const errors = validateRegister({
        name: 'Test',
        email: 'test@example.com',
        password: 'PasswordAb',
        captchaToken: 'valid',
      });
      expect(errors.some((e) => e.field === 'password')).toBe(true);
    });

    it('should error on missing captcha', () => {
      const errors = validateRegister({
        name: 'Test',
        email: 'test@example.com',
        password: 'Password1',
      });
      expect(errors.some((e) => e.field === 'captchaToken')).toBe(true);
    });

    it('should return multiple errors for completely invalid input', () => {
      const errors = validateRegister({});
      expect(errors.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('validateLogin', () => {
    it('should return no errors for valid input', () => {
      const errors = validateLogin({
        email: 'test@example.com',
        password: 'x',
      });
      expect(errors).toHaveLength(0);
    });

    it('should error on invalid email', () => {
      const errors = validateLogin({ email: 'bad', password: 'x' });
      expect(errors.some((e) => e.field === 'email')).toBe(true);
    });

    it('should error on missing password', () => {
      const errors = validateLogin({ email: 'test@example.com' });
      expect(errors.some((e) => e.field === 'password')).toBe(true);
    });
  });

  describe('validateForgotPassword', () => {
    it('should return no errors for valid email', () => {
      const errors = validateForgotPassword({ email: 'test@example.com' });
      expect(errors).toHaveLength(0);
    });

    it('should error on invalid email', () => {
      const errors = validateForgotPassword({ email: 'bad' });
      expect(errors.some((e) => e.field === 'email')).toBe(true);
    });
  });

  describe('validateResetPassword', () => {
    it('should return no errors for valid input', () => {
      const errors = validateResetPassword({
        token: 'abc',
        newPassword: 'Password1',
      });
      expect(errors).toHaveLength(0);
    });

    it('should error on missing token', () => {
      const errors = validateResetPassword({ newPassword: 'Password1' });
      expect(errors.some((e) => e.field === 'token')).toBe(true);
    });

    it('should error on weak new password', () => {
      const errors = validateResetPassword({
        token: 'abc',
        newPassword: 'weak',
      });
      expect(errors.some((e) => e.field === 'newPassword')).toBe(true);
    });
  });

  describe('validateVerify2fa', () => {
    it('should return no errors for valid 6-digit code', () => {
      const errors = validateVerify2fa({ code: '123456' });
      expect(errors).toHaveLength(0);
    });

    it('should error on missing code', () => {
      const errors = validateVerify2fa({});
      expect(errors.some((e) => e.field === 'code')).toBe(true);
    });

    it('should error on non-6-digit code', () => {
      const errors = validateVerify2fa({ code: '12345' });
      expect(errors.some((e) => e.field === 'code')).toBe(true);
    });

    it('should error on non-numeric code', () => {
      const errors = validateVerify2fa({ code: 'abcdef' });
      expect(errors.some((e) => e.field === 'code')).toBe(true);
    });
  });
});
