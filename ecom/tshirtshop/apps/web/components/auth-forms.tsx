"use client";

import { useState, useRef, useCallback } from "react";
import { authClient } from "../lib/auth-client";
import ReCAPTCHA from "react-google-recaptcha";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

const RECAPTCHA_SITEKEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITEKEY || "";

function validateEmail(email: string): string | null {
  if (!email) return "Email is required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return "Please enter a valid email address";
  return null;
}

function validatePassword(password: string): string | null {
  if (!password) return "Password is required";
  if (password.length < 8) return "Password must be at least 8 characters";
  if (!/[A-Z]/.test(password))
    return "Must contain at least one uppercase letter";
  if (!/[a-z]/.test(password))
    return "Must contain at least one lowercase letter";
  if (!/\d/.test(password)) return "Must contain at least one number";
  return null;
}

function ErrorMessage({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p className="text-destructive text-sm mt-1" role="alert">
      {message}
    </p>
  );
}

function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <Alert variant="destructive" role="alert">
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}

function FormSuccess({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <Alert className="border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-400">
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}

function OAuthButtons() {
  const handleGoogle = () => {
    authClient.signIn.social({
      provider: "google",
      callbackURL: "/auth/callback",
    });
  };

  const handleFacebook = () => {
    authClient.signIn.social({
      provider: "facebook",
      callbackURL: "/auth/callback",
    });
  };

  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={handleGoogle}
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        Continue with Google
      </Button>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={handleFacebook}
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1877F2">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
        Continue with Facebook
      </Button>

      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">
            Or continue with email
          </span>
        </div>
      </div>
    </div>
  );
}

export function LoginForm({
  onForgotPassword,
}: {
  onForgotPassword?: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | null>>(
    {},
  );
  const [twoFactorRequired, setTwoFactorRequired] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState("");

  const validateForm = (): boolean => {
    const errors: Record<string, string | null> = {};
    errors.email = validateEmail(email);
    errors.password = password ? null : "Password is required";
    setFieldErrors(errors);
    return !Object.values(errors).some(Boolean);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const result = await authClient.signIn.email({
        email,
        password,
      });

      if (result?.error) {
        const msg = result.error.message || "Login failed";
        if (
          msg.toLowerCase().includes("two factor") ||
          (result as any)?.data?.twoFactorRedirect
        ) {
          setTwoFactorRequired(true);
          return;
        }
        setFormError(msg);
        return;
      }

      // Better Auth sets the session cookie automatically
      window.location.reload();
    } catch {
      setFormError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handle2fa = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsLoading(true);

    try {
      const result = await authClient.twoFactor.verifyTotp({
        code: twoFactorCode,
      });
      if (result?.error) {
        setFormError(result.error.message || "Invalid verification code");
        return;
      }

      // Better Auth sets the session cookie on successful 2FA verification
      window.location.reload();
    } catch {
      setFormError("Verification failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (twoFactorRequired) {
    return (
      <form onSubmit={handle2fa} className="space-y-4 max-w-md mx-auto">
        <h2 className="text-2xl font-bold">Two-Factor Authentication</h2>
        <p className="text-gray-600 text-sm">
          Enter the 6-digit code from your authenticator app.
        </p>
        <FormError message={formError} />
        <div className="space-y-2">
          <Label htmlFor="2fa-code">Verification Code</Label>
          <Input
            id="2fa-code"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            autoComplete="one-time-code"
            value={twoFactorCode}
            onChange={(e) =>
              setTwoFactorCode(e.target.value.replace(/\D/g, ""))
            }
            required
            className="text-center text-2xl tracking-widest"
            placeholder="000000"
          />
        </div>
        <Button
          type="submit"
          className="w-full"
          disabled={isLoading || twoFactorCode.length !== 6}
        >
          {isLoading ? "Verifying..." : "Verify"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="w-full"
          onClick={() => setTwoFactorRequired(false)}
        >
          Back to login
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
      <h2 className="text-2xl font-bold">Sign In</h2>
      <OAuthButtons />
      <FormError message={formError} />
      <div className="space-y-2">
        <Label htmlFor="login-email">Email</Label>
        <Input
          id="login-email"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setFieldErrors((p) => ({ ...p, email: null }));
          }}
          required
          autoComplete="email"
        />
        <ErrorMessage message={fieldErrors.email ?? null} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="login-password">Password</Label>
        <Input
          id="login-password"
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setFieldErrors((p) => ({ ...p, password: null }));
          }}
          required
          autoComplete="current-password"
        />
        <ErrorMessage message={fieldErrors.password ?? null} />
      </div>
      <div className="flex items-center justify-end">
        <Button
          type="button"
          variant="link"
          className="text-sm px-0"
          onClick={onForgotPassword}
        >
          Forgot your password?
        </Button>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Signing in..." : "Sign In"}
      </Button>
    </form>
  );
}

export function SignUpForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | null>>(
    {},
  );
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaRef = useRef<ReCAPTCHA>(null);

  const validateForm = (): boolean => {
    const errors: Record<string, string | null> = {};
    errors.name = name.trim()
      ? name.trim().length > 100
        ? "Name must not exceed 100 characters"
        : null
      : "Name is required";
    errors.email = validateEmail(email);
    errors.password = validatePassword(password);
    errors.captcha =
      RECAPTCHA_SITEKEY && !captchaToken ? "Please complete the CAPTCHA" : null;
    setFieldErrors(errors);
    return !Object.values(errors).some(Boolean);
  };

  const handleCaptchaVerify = useCallback((token: string | null) => {
    setCaptchaToken(token);
    if (token) setFieldErrors((p) => ({ ...p, captcha: null }));
  }, []);

  const handleCaptchaExpire = useCallback(() => {
    setCaptchaToken(null);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const result = await authClient.signUp.email({
        name: name.trim(),
        email,
        password,
        ...(RECAPTCHA_SITEKEY &&
          captchaToken && {
            fetchOptions: {
              headers: {
                "x-captcha-response": captchaToken,
              },
            },
          }),
      });

      if (result?.error) {
        const msg = result.error.message || "Registration failed";
        setFormError(msg);
        captchaRef.current?.reset();
        setCaptchaToken(null);
        return;
      }

      setFormSuccess(
        "Account created! Please check your email to verify your address.",
      );

      // Redirect after a short delay
      setTimeout(() => window.location.reload(), 2000);
    } catch {
      setFormError("An unexpected error occurred. Please try again.");
      captchaRef.current?.reset();
      setCaptchaToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
      <h2 className="text-2xl font-bold">Sign Up</h2>
      <OAuthButtons />
      <FormError message={formError} />
      <FormSuccess message={formSuccess} />
      <div className="space-y-2">
        <Label htmlFor="signup-name">Name</Label>
        <Input
          id="signup-name"
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setFieldErrors((p) => ({ ...p, name: null }));
          }}
          required
          autoComplete="name"
        />
        <ErrorMessage message={fieldErrors.name ?? null} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-email">Email</Label>
        <Input
          id="signup-email"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setFieldErrors((p) => ({ ...p, email: null }));
          }}
          required
          autoComplete="email"
        />
        <ErrorMessage message={fieldErrors.email ?? null} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-password">Password</Label>
        <Input
          id="signup-password"
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setFieldErrors((p) => ({ ...p, password: null }));
          }}
          required
          autoComplete="new-password"
        />
        <ErrorMessage message={fieldErrors.password ?? null} />
        <p className="text-xs text-muted-foreground">
          Min 8 chars, with uppercase, lowercase, and a number.
        </p>
      </div>

      {/* Google reCAPTCHA */}
      {RECAPTCHA_SITEKEY && (
        <div>
          <ReCAPTCHA
            sitekey={RECAPTCHA_SITEKEY}
            onChange={handleCaptchaVerify}
            onExpired={handleCaptchaExpire}
            ref={captchaRef}
          />
          <ErrorMessage message={fieldErrors.captcha ?? null} />
        </div>
      )}

      <Button
        type="submit"
        className="w-full"
        disabled={isLoading}
      >
        {isLoading ? "Signing up..." : "Sign Up"}
      </Button>
    </form>
  );
}

export function ForgotPasswordForm({ onBack }: { onBack?: () => void }) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    const emailErr = validateEmail(email);
    if (emailErr) {
      setFormError(emailErr);
      return;
    }

    setIsLoading(true);
    try {
      const result = await authClient.requestPasswordReset({
        email,
        redirectTo: "/auth/reset-password",
      });
      if (result?.error) {
        setFormError(result.error.message || "Failed to send reset email");
      } else {
        setFormSuccess(
          "If an account exists with that email, you'll receive a password reset link.",
        );
      }
    } catch {
      setFormError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
      <h2 className="text-2xl font-bold">Forgot Password</h2>
      <p className="text-gray-600 text-sm">
        Enter your email and we&apos;ll send you a link to reset your password.
      </p>
      <FormError message={formError} />
      <FormSuccess message={formSuccess} />
      <div className="space-y-2">
        <Label htmlFor="forgot-email">Email</Label>
        <Input
          id="forgot-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Sending..." : "Send Reset Link"}
      </Button>
      {onBack && (
        <Button
          type="button"
          variant="ghost"
          className="w-full"
          onClick={onBack}
        >
          Back to login
        </Button>
      )}
    </form>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const pwErr = validatePassword(password);
    if (pwErr) {
      setFormError(pwErr);
      return;
    }
    if (password !== confirmPassword) {
      setFormError("Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      const result = await authClient.resetPassword({
        newPassword: password,
        token,
      });
      if (result?.error) {
        setFormError(result.error.message || "Failed to reset password");
      } else {
        setFormSuccess("Password reset successfully! You can now sign in.");
      }
    } catch {
      setFormError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
      <h2 className="text-2xl font-bold">Reset Password</h2>
      <FormError message={formError} />
      <FormSuccess message={formSuccess} />
      <div className="space-y-2">
        <Label htmlFor="reset-password">New Password</Label>
        <Input
          id="reset-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="new-password"
        />
        <p className="text-xs text-muted-foreground">
          Min 8 chars, with uppercase, lowercase, and a number.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="reset-confirm">Confirm Password</Label>
        <Input
          id="reset-confirm"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          autoComplete="new-password"
        />
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Resetting..." : "Reset Password"}
      </Button>
    </form>
  );
}

export function TwoFactorSetupForm() {
  const [totpURI, setTotpURI] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [step, setStep] = useState<"start" | "verify" | "done">("start");

  const handleEnable = async () => {
    setIsLoading(true);
    setFormError(null);
    try {
      const pass = prompt("Please enter your current password:") || "";
      const result = await authClient.twoFactor.enable({
        password: pass,
        issuer: "my-app-name",
      });
      if (result?.error) {
        setFormError(result.error.message || "Failed to enable 2FA");
        return;
      }
      setTotpURI((result as any)?.data?.totpURI ?? null);
      setBackupCodes((result as any)?.data?.backupCodes ?? []);
      setStep("verify");
    } catch {
      setFormError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setFormError(null);
    try {
      const result = await authClient.twoFactor.verifyTotp({ code });
      if (result?.error) {
        setFormError(result.error.message || "Invalid code");
        return;
      }
      setFormSuccess("Two-factor authentication enabled successfully!");
      setStep("done");
    } catch {
      setFormError("Verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisable = async () => {
    setIsLoading(true);
    setFormError(null);
    try {
      const pass =
        prompt("Please enter your current password to disable 2FA:") || "";
      const result = await authClient.twoFactor.disable({ password: pass });
      if (result?.error) {
        setFormError(result.error.message || "Failed to disable 2FA");
        return;
      }
      setFormSuccess("Two-factor authentication has been disabled.");
    } catch {
      setFormError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (step === "start") {
    return (
      <div className="space-y-4 max-w-md mx-auto">
        <h2 className="text-2xl font-bold">Two-Factor Authentication</h2>
        <p className="text-gray-600 text-sm">
          Add an extra layer of security to your account using an authenticator
          app (e.g., Google Authenticator, Authy).
        </p>
        <FormError message={formError} />
        <FormSuccess message={formSuccess} />
        <div className="flex gap-3">
          <Button
            onClick={handleEnable}
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? "Setting up..." : "Enable 2FA"}
          </Button>
          <Button
            onClick={handleDisable}
            disabled={isLoading}
            variant="destructive"
            className="flex-1"
          >
            Disable 2FA
          </Button>
        </div>
      </div>
    );
  }

  if (step === "verify") {
    return (
      <form onSubmit={handleVerify} className="space-y-4 max-w-md mx-auto">
        <h2 className="text-2xl font-bold">Scan QR Code</h2>
        <p className="text-gray-600 text-sm">
          Scan this QR code with your authenticator app, then enter the code
          below.
        </p>
        <FormError message={formError} />

        {totpURI && (
          <div className="flex justify-center p-4 bg-white border rounded-lg">
            {/* QR code rendered as an image using a QR code service or the URI itself */}
            <div className="text-center">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(totpURI)}`}
                alt="2FA QR Code"
                width={200}
                height={200}
              />
              <p className="text-xs text-gray-400 mt-2 break-all">{totpURI}</p>
            </div>
          </div>
        )}

        {backupCodes.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md">
            <p className="text-sm font-medium text-yellow-800 mb-2">
              Save these backup codes in a safe place:
            </p>
            <div className="grid grid-cols-2 gap-1 font-mono text-sm">
              {backupCodes.map((bc) => (
                <span key={bc}>{bc}</span>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="totp-code">Verification Code</Label>
          <Input
            id="totp-code"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            required
            className="text-center text-2xl tracking-widest"
            placeholder="000000"
          />
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading || code.length !== 6}
        >
          {isLoading ? "Verifying..." : "Verify & Enable"}
        </Button>
      </form>
    );
  }

  return (
    <div className="space-y-4 max-w-md mx-auto text-center">
      <FormSuccess message={formSuccess} />
      <a href="/" className="text-blue-600 hover:text-blue-800 text-sm">
        Go to home
      </a>
    </div>
  );
}
