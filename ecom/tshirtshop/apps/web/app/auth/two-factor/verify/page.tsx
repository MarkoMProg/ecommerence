"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function TwoFactorVerifyPage() {
  const router = useRouter();
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
      router.push("/");
      router.refresh();
    } catch {
      setFormError("Verification failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <Card className="w-full max-w-md border-white/10 bg-[#1A1A1A]">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">
            Two-Factor Authentication
          </CardTitle>
          <CardDescription className="text-white/60">
            {useBackupCode
              ? "Enter one of your backup codes to sign in."
              : "Enter the 6-digit code from your authenticator app."}
          </CardDescription>
        </CardHeader>
        <CardContent>
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
              className="w-full"
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
              onClick={() => router.push("/auth/login")}
            >
              Back to login
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
