"use client";

import { useState } from "react";
import { useAuth } from "../components/auth-provider";
import {
  LoginForm,
  SignUpForm,
  ForgotPasswordForm,
} from "../components/auth-forms";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function Home() {
  const { session, isLoading, signOut } = useAuth();
  const [activeForm, setActiveForm] = useState<"login" | "signup" | "forgot">(
    "login",
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    );
  }

  if (session?.user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <h1 className="text-3xl font-bold">Welcome!</h1>
            <p className="text-muted-foreground text-sm">
              You are signed in as: {session.user.email}
            </p>
            <p className="text-muted-foreground text-sm">
              Session managed by Better Auth
            </p>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button variant="secondary" asChild>
              <a href="/auth/two-factor/setup">
                Two-Factor Authentication Settings
              </a>
            </Button>
            <Button variant="destructive" onClick={signOut}>
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {activeForm !== "forgot" && (
        <div className="flex justify-center mb-8">
          <div className="inline-flex rounded-lg border bg-muted p-1">
            <Button
              variant={activeForm === "login" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setActiveForm("login")}
            >
              Sign In
            </Button>
            <Button
              variant={activeForm === "signup" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setActiveForm("signup")}
            >
              Sign Up
            </Button>
          </div>
        </div>
      )}

      {activeForm === "login" && (
        <LoginForm onForgotPassword={() => setActiveForm("forgot")} />
      )}
      {activeForm === "signup" && <SignUpForm />}
      {activeForm === "forgot" && (
        <ForgotPasswordForm onBack={() => setActiveForm("login")} />
      )}
    </div>
  );
}
