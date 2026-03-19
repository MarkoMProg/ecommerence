"use client";

import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { authClient } from "../lib/auth-client";

/** Extended user type from better-auth session (includes custom fields from backend). */
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  image?: string | null;
  /** better-auth may return null when 2FA not configured */
  twoFactorEnabled?: boolean | null;
  /** better-auth may return null when role not set */
  role?: string | null;
}

interface AuthContextType {
  session: { user?: AuthUser } | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, isPending: isLoading } = authClient.useSession();
  const [decryptedUser, setDecryptedUser] = useState<AuthUser | null>(null);

  // Fetch decrypted user from our backend guard (which decrypts email/name at rest).
  // authClient.useSession() returns raw DB values; /api/v1/auth/me returns plaintext.
  useEffect(() => {
    if (!session?.user?.id) {
      setDecryptedUser(null);
      return;
    }
    fetch("/api/v1/auth/me", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { user?: AuthUser } | null) => {
        if (data?.user) setDecryptedUser(data.user);
      })
      .catch(() => {});
  }, [session?.user?.id]);

  const signOut = async () => {
    try {
      await authClient.signOut();
    } finally {
      setDecryptedUser(null);
      // Clear 2FA verification flag so next login requires re-verification.
      sessionStorage.removeItem("2fa_verified");
      window.location.href = "/";
    }
  };

  // Overlay decrypted user onto the raw session so all consumers get plaintext.
  const mergedSession = useMemo(() => {
    if (!session) return null;
    return {
      ...session,
      user: decryptedUser ?? (session.user as AuthUser | undefined),
    };
  }, [session, decryptedUser]);

  const value = useMemo(
    () => ({
      session: mergedSession,
      // Keep isLoading true until we have decrypted user data, so components
      // never briefly display the blind-index email from the raw session.
      isLoading: isLoading || (!!session?.user?.id && !decryptedUser),
      signOut,
    }),
    [mergedSession, isLoading, session?.user?.id, decryptedUser],
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
