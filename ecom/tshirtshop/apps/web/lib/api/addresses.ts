/** Frontend API client for saved user addresses (ADDR-001) */

function apiBase(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return process.env.API_URL || "http://127.0.0.1:3000";
}

export interface SavedAddress {
  id: string;
  userId: string;
  label: string;
  fullName: string;
  phone: string | null;
  line1: string;
  line2: string | null;
  city: string;
  stateOrRegion: string;
  postalCode: string;
  country: string;
  isDefaultShipping: boolean;
  isDefaultBilling: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAddressInput {
  label?: string;
  fullName: string;
  phone?: string;
  line1: string;
  line2?: string;
  city: string;
  stateOrRegion: string;
  postalCode: string;
  country: string;
  isDefaultShipping?: boolean;
  isDefaultBilling?: boolean;
}

export type UpdateAddressInput = Partial<CreateAddressInput>;

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const msg = body?.error?.message ?? "Request failed";
    throw new Error(msg);
  }
  const json = (await res.json()) as { success: boolean; data: T };
  if (!json.success) throw new Error("Unexpected response");
  return json.data;
}

export async function fetchMyAddresses(): Promise<SavedAddress[]> {
  const res = await fetch(`${apiBase()}/api/v1/addresses`, {
    credentials: "include",
  });
  return handleResponse<SavedAddress[]>(res);
}

export async function createAddress(input: CreateAddressInput): Promise<SavedAddress> {
  const res = await fetch(`${apiBase()}/api/v1/addresses`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });
  return handleResponse<SavedAddress>(res);
}

export async function updateAddress(
  id: string,
  input: UpdateAddressInput
): Promise<SavedAddress> {
  const res = await fetch(`${apiBase()}/api/v1/addresses/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });
  return handleResponse<SavedAddress>(res);
}

export async function deleteAddress(id: string): Promise<void> {
  const res = await fetch(`${apiBase()}/api/v1/addresses/${encodeURIComponent(id)}`, {
    method: "DELETE",
    credentials: "include",
  });
  await handleResponse<null>(res);
}

export async function setDefaultShipping(id: string): Promise<SavedAddress> {
  const res = await fetch(
    `${apiBase()}/api/v1/addresses/${encodeURIComponent(id)}/set-default-shipping`,
    { method: "PATCH", credentials: "include" }
  );
  return handleResponse<SavedAddress>(res);
}

export async function setDefaultBilling(id: string): Promise<SavedAddress> {
  const res = await fetch(
    `${apiBase()}/api/v1/addresses/${encodeURIComponent(id)}/set-default-billing`,
    { method: "PATCH", credentials: "include" }
  );
  return handleResponse<SavedAddress>(res);
}
