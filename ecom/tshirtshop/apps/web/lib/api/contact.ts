/**
 * Contact form API client.
 */

import { nextAppOriginForServerFetch } from "./next-origin";

function apiBase(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return nextAppOriginForServerFetch();
}

export interface ContactPayload {
  name: string;
  email: string;
  subject?: string;
  message: string;
}

export async function submitContactForm(payload: ContactPayload): Promise<void> {
  const res = await fetch(`${apiBase()}/api/v1/contact`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    const msg =
      json?.error?.message ?? json?.error?.details?.[0]?.message ?? "Failed to send message";
    throw new Error(msg);
  }
}
