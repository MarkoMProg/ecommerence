import { createAuthClient } from "better-auth/react";
import { twoFactorClient, adminClient } from "better-auth/client/plugins";

/**
 * Auth client base URL:
 * - Browser: use the current page origin (e.g. http://localhost:3001)
 *   so all auth requests go through Next.js rewrites as same-origin calls,
 *   avoiding CORS overhead.
 * - Server (SSR/RSC): use NEXT_PUBLIC_APP_URL or fall back to localhost:3001.
 *
 * Next.js rewrites /api/:path* → backend, so /api/auth/* is proxied automatically.
 */
const baseURL =
  typeof window !== "undefined"
    ? window.location.origin
    : (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001");

export const authClient = createAuthClient({
  baseURL,
  plugins: [twoFactorClient(), adminClient()],
});
