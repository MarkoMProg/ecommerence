"use client";

import { useEffect, useState } from "react";
import { authClient } from "../../../lib/auth-client";

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
        const { data: session } = await authClient.getSession();
        if (session?.user) {
          setStatus("success");
          setTimeout(() => {
            window.location.href = "/";
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
    <div className="flex justify-center items-center min-h-screen">
      {status === "loading" && (
        <div className="text-center">
          <div className="animate-pulse text-gray-500 text-lg">
            Completing sign in...
          </div>
        </div>
      )}

      {status === "success" && (
        <div className="text-center text-green-700">
          <p className="text-lg font-medium">Signed in successfully!</p>
          <p className="text-sm text-gray-500">Redirecting...</p>
        </div>
      )}

      {status === "error" && (
        <div className="text-center">
          <p className="text-lg font-medium text-red-700">
            Authentication failed
          </p>
          <p className="text-gray-600 text-sm mb-4">
            We could not complete your sign in. Please try again.
          </p>
          <a
            href="/"
            className="inline-block bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 transition-colors"
          >
            Go to Sign In
          </a>
        </div>
      )}
    </div>
  );
}
