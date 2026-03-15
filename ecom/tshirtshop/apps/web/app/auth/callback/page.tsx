"use client";

import { useEffect, useState } from "react";
import { authClient } from "../../../lib/auth-client";
import type { AuthUser } from "../../../components/auth-provider";

/**
 * OAuth callback page.
 * After a social login (Google / Facebook), Better Auth redirects here
 * with a session cookie already set. We just verify the session and redirect.
 */
export default function AuthCallbackPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );

  useEffect(() => {
    async function verify() {
      try {
        const redirect = sessionStorage.getItem("auth_redirect") ?? "/";
        sessionStorage.removeItem("auth_redirect");

        const { data: session } = await authClient.getSession();
        if (session?.user) {
          if ((session.user as AuthUser).twoFactorEnabled) {
            window.location.href = `/auth/two-factor/verify?redirect=${encodeURIComponent(redirect)}`;
            return;
          }
          setStatus("success");
          setTimeout(() => {
            window.location.href = redirect;
          }, 500);
        } else {
          setStatus("error");
        }
      } catch {
        setStatus("error");
      }
    }

    verify();
  }, []);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        {status === "loading" && (
          <div className="animate-pulse text-white/60">Completing sign in...</div>
        )}

        {status === "success" && (
          <div className="text-white/80">
            <p className="text-lg font-medium">Signed in successfully!</p>
            <p className="mt-1 text-sm text-white/60">Redirecting...</p>
          </div>
        )}

        {status === "error" && (
          <div className="rounded-lg border border-white/10 bg-[#1A1A1A] p-8">
            <p className="text-lg font-medium text-white">
              Authentication failed
            </p>
            <p className="mt-2 text-sm text-white/60">
              We could not complete your sign in. Please try again.
            </p>
            <a
              href="/auth/login"
              className="mt-6 inline-block rounded-md bg-[#FF4D00] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#FF4D00]/90"
            >
              Go to Sign In
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
