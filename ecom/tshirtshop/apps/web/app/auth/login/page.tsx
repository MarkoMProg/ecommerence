"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import {
  LoginForm,
  SignUpForm,
  ForgotPasswordForm,
} from "@/components/auth-forms";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Link from "next/link";

function LoginPageInner() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "/";
  const { session, isLoading, signOut } = useAuth();
  const [activeForm, setActiveForm] = useState<"login" | "signup" | "forgot">(
    "login",
  );

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="animate-pulse text-white/60">Loading...</div>
      </div>
    );
  }

  if (session?.user) {
    return (
      <div className="mx-auto max-w-md px-6 py-16">
        <Card className="border-white/10 bg-[#1A1A1A]">
          <CardHeader className="text-center">
            <h1
              className="text-2xl font-bold uppercase tracking-tight text-white"
              style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
            >
              Welcome
            </h1>
            <p className="text-white/60 text-sm">
              Signed in as {session.user.email}
            </p>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button variant="secondary" asChild>
              <Link href="/account">My Account</Link>
            </Button>
            <Button variant="secondary" asChild>
              <Link href="/auth/two-factor/setup">
                Two-Factor Authentication
              </Link>
            </Button>
            <Button variant="destructive" onClick={signOut}>
              Sign Out
            </Button>
            <Button variant="outline" asChild>
              <Link href={redirectTo}>
                {redirectTo === "/admin" ? "Continue to Admin" : "Continue"}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      {redirectTo === "/admin" && (
        <p className="mb-6 text-center text-xs uppercase tracking-wider text-[#FF4D00]">
          Admin access required
        </p>
      )}
      {activeForm !== "forgot" && (
        <div className="mb-8 flex justify-center">
          <div className="inline-flex rounded-md border border-white/20 bg-white/5 p-1">
            <Button
              variant={activeForm === "login" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setActiveForm("login")}
              className={
                activeForm === "login"
                  ? "bg-[#FF4D00] text-white hover:bg-[#FF4D00]/90"
                  : "text-white/80 hover:text-white"
              }
            >
              Sign In
            </Button>
            <Button
              variant={activeForm === "signup" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setActiveForm("signup")}
              className={
                activeForm === "signup"
                  ? "bg-[#FF4D00] text-white hover:bg-[#FF4D00]/90"
                  : "text-white/80 hover:text-white"
              }
            >
              Sign Up
            </Button>
          </div>
        </div>
      )}

      {activeForm === "login" && (
        <LoginForm
          redirectTo={redirectTo}
          onForgotPassword={() => setActiveForm("forgot")}
        />
      )}
      {activeForm === "signup" && <SignUpForm />}
      {activeForm === "forgot" && (
        <ForgotPasswordForm onBack={() => setActiveForm("login")} />
      )}

      <p className="mt-6 text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white"
        >
          <ArrowLeft className="size-4" />
          Back to homepage
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center"><div className="animate-pulse text-white/60">Loading...</div></div>}>
      <LoginPageInner />
    </Suspense>
  );
}
