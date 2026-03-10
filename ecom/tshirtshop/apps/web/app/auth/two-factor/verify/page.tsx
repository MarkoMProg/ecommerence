"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

function TwoFactorVerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "/";
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [useBackupCode, setUseBackupCode] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsLoading(true);

    try {
      let result;
      if (useBackupCode) {
        result = await authClient.twoFactor.verifyBackupCode({ code });
      } else {
        result = await authClient.twoFactor.verifyTotp({ code });
      }

      if (result?.error) {
        setFormError(result.error.message || "Invalid verification code. Please try again.");
        return;
      }

      // Mark 2FA as verified for this browser session so the global guard allows access.
      sessionStorage.setItem("2fa_verified", "true");
      router.push(redirectTo);
      router.refresh();
    } catch {
      setFormError("Verification failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A0A0A]/90 px-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-lg border border-white/10 bg-[#1A1A1A] shadow-[0_0_40px_rgba(0,0,0,0.5)]">
        <div className="p-8 sm:p-10">
          <div className="mb-6 flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#FF4D00]/30 bg-[#FF4D00]/10">
              <Lock className="size-7 text-[#FF4D00]/70" />
            </div>
          </div>
          <h2
            className="mb-2 text-center text-xl font-bold uppercase tracking-tight text-white sm:text-2xl"
            style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
          >
            Two-Factor Authentication
          </h2>
          <p className="mb-6 text-center text-sm text-white/60">
            {useBackupCode
              ? "Enter one of your backup codes to sign in."
              : "Enter the 6-digit code from your authenticator app."}
          </p>
          <form onSubmit={handleVerify} className="space-y-4">
            {formError && (
              <Alert variant="destructive" role="alert">
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="verify-code">
                {useBackupCode ? "Backup Code" : "Verification Code"}
              </Label>
              {useBackupCode ? (
                <Input
                  id="verify-code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.trim())}
                  required
                  autoComplete="one-time-code"
                  autoFocus
                  placeholder="xxxxxxxxxx"
                />
              ) : (
                <Input
                  id="verify-code"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  required
                  autoComplete="one-time-code"
                  autoFocus
                  className="text-center text-2xl tracking-widest"
                  placeholder="000000"
                />
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-[#FF4D00] font-medium uppercase tracking-wider text-white hover:bg-[#FF4D00]/90 hover:shadow-[0_0_20px_rgba(255,77,0,0.3)]"
              disabled={isLoading || (!useBackupCode && code.length !== 6) || (useBackupCode && code.length === 0)}
            >
              {isLoading ? "Verifying..." : "Verify"}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full text-sm text-white/60 hover:text-white"
              onClick={() => {
                setUseBackupCode((v) => !v);
                setCode("");
                setFormError(null);
              }}
            >
              {useBackupCode
                ? "Use authenticator app instead"
                : "Use a backup code instead"}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full text-sm text-white/60 hover:text-white"
              onClick={() => router.push(`/auth/login?redirect=${encodeURIComponent(redirectTo)}`)}
            >
              Back to login
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function TwoFactorVerifyPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center"><div className="animate-pulse text-white/60">Loading...</div></div>}>
      <TwoFactorVerifyContent />
    </Suspense>
  );
}
