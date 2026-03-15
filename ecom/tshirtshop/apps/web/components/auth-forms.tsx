"use client";

import { useState, useRef, useCallback } from "react";

/** Better Auth sign-in context with 2FA redirect flag */
interface SignInContextData {
  twoFactorRedirect?: boolean;
}

/** Better Auth 2FA enable response */
interface TwoFactorEnableData {
  totpURI?: string;
  backupCodes?: string[];
}
import { useRouter } from "next/navigation";
import { authClient } from "../lib/auth-client";
import ReCAPTCHA from "react-google-recaptcha";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ShieldCheck,
  CheckCircle2,
  Eye,
  EyeOff,
  QrCode,
  KeyRound,
} from "lucide-react";

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

function OAuthButtons({ redirectTo }: { redirectTo?: string }) {
  const handleGoogle = () => {
    if (redirectTo) sessionStorage.setItem("auth_redirect", redirectTo);
    authClient.signIn.social({
      provider: "google",
      callbackURL: `${window.location.origin}/auth/callback`,
    });
  };

  const handleFacebook = () => {
    if (redirectTo) sessionStorage.setItem("auth_redirect", redirectTo);
    authClient.signIn.social({
      provider: "facebook",
      callbackURL: `${window.location.origin}/auth/callback`,
    });
  };

  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant="outline"
        className="w-full border-white/20 bg-white/5 text-white hover:bg-white/10"
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
        className="w-full border-white/20 bg-white/5 text-white hover:bg-white/10"
        onClick={handleFacebook}
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1877F2">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
        Continue with Facebook
      </Button>

      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-[#0A0A0A] px-2 text-white/50">
            Or continue with email
          </span>
        </div>
      </div>
    </div>
  );
}

export function LoginForm({
  redirectTo = "/",
  onForgotPassword,
}: {
  redirectTo?: string;
  onForgotPassword?: () => void;
}) {
  const router = useRouter();
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
      const result = await authClient.signIn.email(
        { email, password },
        {
          async onSuccess(context) {
            if ((context.data as SignInContextData)?.twoFactorRedirect) {
              router.push(`/auth/two-factor/verify?redirect=${encodeURIComponent(redirectTo)}`);
            } else {
              router.push(redirectTo);
            }
          },
        },
      );

      if (result?.error) {
        const msg = result.error.message || "Login failed";
        if (
          msg.toLowerCase().includes("two factor") ||
          (result?.data as SignInContextData)?.twoFactorRedirect
        ) {
          router.push(`/auth/two-factor/verify?redirect=${encodeURIComponent(redirectTo)}`);
          return;
        }
        setFormError(msg);
        return;
      }
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
        <h2
          className="text-2xl font-bold uppercase tracking-tight text-white"
          style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
        >
          Two-Factor Authentication
        </h2>
        <p className="text-sm text-white/60">
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
          className="w-full bg-[#FF4D00] font-medium uppercase tracking-wider text-white hover:bg-[#FF4D00]/90"
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
      <h2
        className="text-2xl font-bold uppercase tracking-tight text-white"
        style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
      >
        Sign In
      </h2>
      <OAuthButtons redirectTo={redirectTo} />
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

      <Button
        type="submit"
        className="w-full bg-[#FF4D00] font-medium uppercase tracking-wider text-white hover:bg-[#FF4D00]/90"
        disabled={isLoading}
      >
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
      <h2
        className="text-2xl font-bold uppercase tracking-tight text-white"
        style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
      >
        Sign Up
      </h2>
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
        className="w-full bg-[#FF4D00] font-medium uppercase tracking-wider text-white hover:bg-[#FF4D00]/90"
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
      <h2
        className="text-2xl font-bold uppercase tracking-tight text-white"
        style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
      >
        Forgot Password
      </h2>
      <p className="text-sm text-white/60">
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
      <Button
        type="submit"
        className="w-full bg-[#FF4D00] font-medium uppercase tracking-wider text-white hover:bg-[#FF4D00]/90"
        disabled={isLoading}
      >
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
      <h2
        className="text-2xl font-bold uppercase tracking-tight text-white"
        style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
      >
        Reset Password
      </h2>
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
      <Button
        type="submit"
        className="w-full bg-[#FF4D00] font-medium uppercase tracking-wider text-white hover:bg-[#FF4D00]/90"
        disabled={isLoading}
      >
        {isLoading ? "Resetting..." : "Reset Password"}
      </Button>
    </form>
  );
}

export function TwoFactorSetupForm() {
  const [totpURI, setTotpURI] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pendingAction, setPendingAction] = useState<
    "enable" | "disable" | null
  >(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [step, setStep] = useState<"start" | "verify" | "done">("start");

  const inputCls =
    "w-full rounded-md border border-white/20 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-[#FF4D00] focus:outline-none focus:ring-1 focus:ring-[#FF4D00] transition-colors";
  const labelCls =
    "mb-1.5 block text-[10px] uppercase tracking-widest text-white/50";

  const clearActionState = () => {
    setPendingAction(null);
    setPassword("");
    setShowPassword(false);
    setFormError(null);
  };

  const handleEnable = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setFormError(null);
    try {
      const result = await authClient.twoFactor.enable({ password });
      if (result?.error) {
        setFormError(result.error.message || "Failed to enable 2FA");
        return;
      }
      const data = (result?.data as TwoFactorEnableData) ?? {};
      setTotpURI(data.totpURI ?? null);
      setBackupCodes(data.backupCodes ?? []);
      clearActionState();
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

  const handleDisable = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setFormError(null);
    try {
      const result = await authClient.twoFactor.disable({ password });
      if (result?.error) {
        setFormError(result.error.message || "Failed to disable 2FA");
        return;
      }
      clearActionState();
      setFormSuccess("Two-factor authentication has been disabled.");
    } catch {
      setFormError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (step === "start") {
    return (
      <div className="w-full max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#FF4D00]/30 bg-[#FF4D00]/10">
            <ShieldCheck className="h-5 w-5 text-[#FF4D00]" />
          </div>
          <div>
            <h2 className="font-[family-name:var(--font-space-grotesk)] text-xl font-bold uppercase tracking-tight text-white">
              Two-Factor Auth
            </h2>
            <p className="text-[11px] text-white/50 uppercase tracking-wider">
              Authenticator app
            </p>
          </div>
        </div>

        <p className="text-sm text-white/60 leading-relaxed">
          Add an extra layer of security using an authenticator app such as{" "}
          <span className="text-white/80">Google Authenticator</span> or{" "}
          <span className="text-white/80">Authy</span>.
        </p>

        <FormError message={formError} />

        {formSuccess && (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            <p className="text-sm text-emerald-300">{formSuccess}</p>
          </div>
        )}

        {/* Enable password confirmation */}
        {pendingAction === "enable" && (
          <form
            onSubmit={handleEnable}
            className="rounded-xl border border-white/10 bg-white/[0.03] p-5 space-y-4"
          >
            <p className="text-[11px] uppercase tracking-widest text-[#FF4D00]">
              Confirm to Enable
            </p>
            <div>
              <label htmlFor="2fa-enable-pw" className={labelCls}>
                Current Password
              </label>
              <div className="relative">
                <input
                  id="2fa-enable-pw"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  required
                  className={`${inputCls} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isLoading || !password}
                className="flex-1 rounded-md bg-[#FF4D00] px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider text-white hover:bg-[#FF4D00]/90 disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
              >
                {isLoading ? "Setting up…" : "Continue →"}
              </button>
              <button
                type="button"
                onClick={clearActionState}
                className="rounded-md border border-white/20 px-4 py-2.5 text-[11px] uppercase tracking-wider text-white/60 hover:bg-white/5 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Disable password confirmation */}
        {pendingAction === "disable" && (
          <form
            onSubmit={handleDisable}
            className="rounded-xl border border-red-500/20 bg-red-500/[0.05] p-5 space-y-4"
          >
            <p className="text-[11px] uppercase tracking-widest text-red-400">
              Confirm Disable 2FA
            </p>
            <p className="text-xs text-white/50">
              This will remove the extra security layer from your account.
            </p>
            <div>
              <label htmlFor="2fa-disable-pw" className={labelCls}>
                Current Password
              </label>
              <div className="relative">
                <input
                  id="2fa-disable-pw"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  required
                  className={`${inputCls} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isLoading || !password}
                className="flex-1 rounded-md bg-red-600 px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider text-white hover:bg-red-600/90 disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
              >
                {isLoading ? "Disabling…" : "Disable 2FA"}
              </button>
              <button
                type="button"
                onClick={clearActionState}
                className="rounded-md border border-white/20 px-4 py-2.5 text-[11px] uppercase tracking-wider text-white/60 hover:bg-white/5 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Main action buttons — hidden while a pending action is shown */}
        {!pendingAction && (
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                setFormError(null);
                setFormSuccess(null);
                setPendingAction("enable");
              }}
              disabled={isLoading}
              className="flex-1 rounded-md bg-[#FF4D00] px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider text-white hover:bg-[#FF4D00]/90 hover:shadow-[0_0_20px_rgba(255,77,0,0.25)] disabled:cursor-not-allowed disabled:opacity-40 transition-all"
            >
              Enable 2FA
            </button>
            <button
              type="button"
              onClick={() => {
                setFormError(null);
                setFormSuccess(null);
                setPendingAction("disable");
              }}
              disabled={isLoading}
              className="flex-1 rounded-md border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider text-red-400 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-40 transition-all"
            >
              Disable 2FA
            </button>
          </div>
        )}
      </div>
    );
  }

  if (step === "verify") {
    return (
      <form
        onSubmit={handleVerify}
        className="w-full max-w-md mx-auto space-y-6"
      >
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#FF4D00]/30 bg-[#FF4D00]/10">
            <QrCode className="h-5 w-5 text-[#FF4D00]" />
          </div>
          <div>
            <h2 className="font-[family-name:var(--font-space-grotesk)] text-xl font-bold uppercase tracking-tight text-white">
              Scan QR Code
            </h2>
            <p className="text-[11px] text-white/50 uppercase tracking-wider">
              Step 2 of 3 — Link your authenticator
            </p>
          </div>
        </div>

        <p className="text-sm text-white/60 leading-relaxed">
          Scan the QR code with your authenticator app, then enter the 6-digit
          code to verify and finish setup.
        </p>

        <FormError message={formError} />

        {/* QR Code */}
        {totpURI && (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-6">
            <div className="rounded-lg bg-white p-3 shadow-[0_0_30px_rgba(255,77,0,0.1)]">
              <Image
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(totpURI)}`}
                alt="2FA QR Code"
                width={180}
                height={180}
              />
            </div>
            <p className="max-w-[260px] break-all text-center font-mono text-[10px] leading-relaxed text-white/25">
              {totpURI}
            </p>
          </div>
        )}

        {/* Backup Codes */}
        {backupCodes.length > 0 && (
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.07] p-5 space-y-3">
            <div className="flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-amber-400" />
              <p className="text-[11px] font-medium uppercase tracking-widest text-amber-400">
                Save Your Backup Codes
              </p>
            </div>
            <p className="text-xs text-white/50">
              Store these somewhere safe. Each code can only be used once if you
              lose access to your authenticator.
            </p>
            <div className="grid grid-cols-2 gap-1.5 font-mono text-xs">
              {backupCodes.map((bc) => (
                <span
                  key={bc}
                  className="rounded border border-amber-500/20 bg-amber-500/10 px-2.5 py-1.5 tracking-widest text-amber-200"
                >
                  {bc}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 6-digit code input */}
        <div>
          <label
            htmlFor="totp-code"
            className="mb-1.5 block text-[10px] uppercase tracking-widest text-white/50"
          >
            Verification Code
          </label>
          <input
            id="totp-code"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            required
            placeholder="000000"
            className="w-full rounded-md border border-white/20 bg-white/5 px-3 py-3 text-center font-mono text-2xl tracking-[0.5em] text-white placeholder:text-white/20 focus:border-[#FF4D00] focus:outline-none focus:ring-1 focus:ring-[#FF4D00] transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || code.length !== 6}
          className="w-full rounded-md bg-[#FF4D00] px-4 py-3 text-[11px] font-medium uppercase tracking-wider text-white hover:bg-[#FF4D00]/90 hover:shadow-[0_0_20px_rgba(255,77,0,0.25)] disabled:cursor-not-allowed disabled:opacity-40 transition-all"
        >
          {isLoading ? "Verifying…" : "Verify & Enable 2FA"}
        </button>
      </form>
    );
  }

  // Done step
  return (
    <div className="w-full max-w-md mx-auto space-y-6 text-center">
      <div className="flex justify-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10">
          <ShieldCheck className="h-8 w-8 text-emerald-400" />
        </div>
      </div>
      <div className="space-y-2">
        <h2 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-bold uppercase tracking-tight text-white">
          2FA Enabled
        </h2>
        <p className="text-sm text-white/60">
          Your account is now protected with two-factor authentication.
        </p>
      </div>
      <a
        href="/account"
        className="inline-flex items-center gap-2 rounded-md border border-white/20 px-5 py-2.5 text-[11px] uppercase tracking-wider text-white/70 hover:bg-white/5 hover:text-white transition-colors"
      >
        Back to Account
      </a>
    </div>
  );
}
