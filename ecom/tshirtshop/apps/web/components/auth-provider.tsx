"use client";

import { createContext, useContext, useMemo, ReactNode } from "react";
import { authClient } from "../lib/auth-client";

interface AuthUser {
  id: string;
  email: string;
  name: string;
  image?: string | null;
  twoFactorEnabled?: boolean;
}

interface AuthContextType {
  session: { user?: AuthUser } | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, isPending: isLoading } = authClient.useSession();

  const signOut = async () => {
    try {
      await authClient.signOut();
    } finally {
      window.location.href = "/";
    }
  };

  const value = useMemo(
    () => ({
      session,
      isLoading,
      signOut,
    }),
    [session, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
