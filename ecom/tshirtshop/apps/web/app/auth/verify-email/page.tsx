"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );

  useEffect(() => {
    if (!token) {
      setStatus("error");
      return;
    }

    // Better Auth handles verification via its own endpoint.
    // This page is shown after the user clicks the verification link.
    // The link goes to Better Auth's verify endpoint which then redirects here.
    setStatus("success");
  }, [token]);

  return (
    <div className="container mx-auto px-4 py-8 text-center">
      {status === "loading" && (
        <div className="animate-pulse text-gray-500">
          Verifying your email...
        </div>
      )}

      {status === "success" && (
        <div>
          <h2 className="text-2xl font-bold mb-4 text-green-700">
            Email Verified!
          </h2>
          <p className="text-gray-600 mb-4">
            Your email has been verified successfully. You can now sign in.
          </p>
          <a
            href="/"
            className="inline-block bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 transition-colors"
          >
            Go to Sign In
          </a>
        </div>
      )}

      {status === "error" && (
        <div>
          <h2 className="text-2xl font-bold mb-4 text-red-700">
            Verification Failed
          </h2>
          <p className="text-gray-600 mb-4">
            The verification link is invalid or has expired.
          </p>
          <a href="/" className="text-blue-600 hover:text-blue-800">
            Go back to home
          </a>
        </div>
      )}
    </div>
  );
}
