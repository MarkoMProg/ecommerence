"use client";

import { useState } from "react";
import { useAuth } from "../components/auth-provider";
import {
  LoginForm,
  SignUpForm,
  ForgotPasswordForm,
} from "../components/auth-forms";

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
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-3xl font-bold mb-4">Welcome!</h1>
          <p className="mb-2">You are signed in as: {session.user.email}</p>
          <p className="mb-6 text-gray-500 text-sm">
            Session managed by Better Auth
          </p>
          <div className="flex flex-col gap-3">
            <a
              href="/auth/two-factor/setup"
              className="inline-block bg-gray-100 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-200 transition-colors"
            >
              Two-Factor Authentication Settings
            </a>
            <button
              onClick={signOut}
              className="bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {activeForm !== "forgot" && (
        <div className="flex justify-center mb-8">
          <div className="bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveForm("login")}
              className={`px-4 py-2 rounded-md transition-colors ${
                activeForm === "login"
                  ? "bg-white shadow-sm"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setActiveForm("signup")}
              className={`px-4 py-2 rounded-md transition-colors ${
                activeForm === "signup"
                  ? "bg-white shadow-sm"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              Sign Up
            </button>
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
