/** Frontend API client for saved payment methods (BILL-001) */

function apiBase(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return process.env.API_URL || "http://127.0.0.1:3000";
}

export interface SavedPaymentMethod {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  funding: string;
  isDefault: boolean;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const msg = body?.error?.message ?? "Request failed";
    const code = body?.error?.code;
    const err = new Error(msg) as Error & { code?: string };
    err.code = code;
    throw err;
  }
  const json = (await res.json()) as { success: boolean; data: T };
  if (!json.success) throw new Error("Unexpected response");
  return json.data;
}

export async function fetchMyPaymentMethods(): Promise<SavedPaymentMethod[]> {
  const res = await fetch(`${apiBase()}/api/v1/billing/payment-methods`, {
    credentials: "include",
  });
  return handleResponse<SavedPaymentMethod[]>(res);
}

/** Returns the Stripe Checkout setup URL. Navigate the user to it. */
export async function createSetupSession(): Promise<string> {
  const res = await fetch(`${apiBase()}/api/v1/billing/setup-session`, {
    method: "POST",
    credentials: "include",
  });
  const data = await handleResponse<{ url: string }>(res);
  return data.url;
}

export async function detachPaymentMethod(pmId: string): Promise<void> {
  const res = await fetch(
    `${apiBase()}/api/v1/billing/payment-methods/${encodeURIComponent(pmId)}`,
    { method: "DELETE", credentials: "include" }
  );
  await handleResponse<null>(res);
}

export async function setDefaultPaymentMethod(pmId: string): Promise<void> {
  const res = await fetch(
    `${apiBase()}/api/v1/billing/payment-methods/${encodeURIComponent(pmId)}/set-default`,
    { method: "PATCH", credentials: "include" }
  );
  await handleResponse<null>(res);
}
