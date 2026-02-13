"use client";

import { ForgotPasswordForm } from "../../../components/auth-forms";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
  const router = useRouter();

  return (
    <div className="container mx-auto px-4 py-8">
      <ForgotPasswordForm onBack={() => router.push("/")} />
    </div>
  );
}
