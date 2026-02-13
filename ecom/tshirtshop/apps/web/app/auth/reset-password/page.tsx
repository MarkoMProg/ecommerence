"use client";

import { useSearchParams } from "next/navigation";
import { ResetPasswordForm } from "../../../components/auth-forms";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  if (!token) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Invalid Reset Link</h2>
        <p className="text-gray-600 mb-4">
          This password reset link is invalid or has expired.
        </p>
        <a
          href="/auth/forgot-password"
          className="text-blue-600 hover:text-blue-800"
        >
          Request a new reset link
        </a>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <ResetPasswordForm token={token} />
    </div>
  );
}
