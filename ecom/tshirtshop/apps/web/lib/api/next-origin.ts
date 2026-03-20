/**
 * Origin for server-side fetch() to this Next.js app (`/api/*` → Nest proxy).
 *
 * WARNING: `process.env.API_URL` is the Nest upstream for `app/api/[...path]/route.ts` only.
 * Using it here makes RSC hit Nest directly and breaks when the browser uses the BFF on another port/protocol.
 */
export function nextAppOriginForServerFetch(): string {
  const internal = process.env.INTERNAL_NEXT_URL?.trim();
  if (internal) return internal.replace(/\/$/, "");
  const publicUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (publicUrl) return publicUrl.replace(/\/$/, "");
  // Local dev: `next dev` uses HTTPS on 3001 (apps/web/package.json).
  return "https://127.0.0.1:3001";
}
