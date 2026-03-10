"use client";

import { useEffect, useState } from "react";
import { MapPin, Plus, Pencil, Trash2, Check, X, Home, Briefcase } from "lucide-react";
import {
  fetchMyAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultShipping,
  setDefaultBilling,
} from "@/lib/api/addresses";
import type { SavedAddress, CreateAddressInput } from "@/lib/api/addresses";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/** ISO 3166-1 alpha-2 codes — must match backend SUPPORTED_COUNTRIES */
const COUNTRIES: { code: string; name: string }[] = [
  { code: "EE", name: "Estonia" },
  { code: "LV", name: "Latvia" },
  { code: "LT", name: "Lithuania" },
  { code: "FI", name: "Finland" },
  { code: "SE", name: "Sweden" },
  { code: "NO", name: "Norway" },
  { code: "DK", name: "Denmark" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "NL", name: "Netherlands" },
  { code: "BE", name: "Belgium" },
  { code: "PL", name: "Poland" },
  { code: "ES", name: "Spain" },
  { code: "IT", name: "Italy" },
  { code: "AT", name: "Austria" },
  { code: "IE", name: "Ireland" },
  { code: "PT", name: "Portugal" },
  { code: "CZ", name: "Czech Republic" },
  { code: "GR", name: "Greece" },
  { code: "RO", name: "Romania" },
  { code: "HU", name: "Hungary" },
  { code: "BG", name: "Bulgaria" },
  { code: "HR", name: "Croatia" },
  { code: "SK", name: "Slovakia" },
  { code: "SI", name: "Slovenia" },
  { code: "LU", name: "Luxembourg" },
  { code: "CY", name: "Cyprus" },
  { code: "MT", name: "Malta" },
  { code: "GB", name: "United Kingdom" },
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "CH", name: "Switzerland" },
  { code: "IS", name: "Iceland" },
];

const BLANK_FORM: CreateAddressInput = {
  label: "Home",
  fullName: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  stateOrRegion: "",
  postalCode: "",
  country: "EE",
  isDefaultShipping: false,
  isDefaultBilling: false,
};

const INPUT_CLS =
  "min-h-[40px] w-full rounded-md border border-white/20 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-[#FF4D00] focus:outline-none focus:ring-1 focus:ring-[#FF4D00]";
const LABEL_CLS = "mb-1 block text-[10px] uppercase tracking-widest text-white/60";

function AddressForm({
  initial,
  onSave,
  onCancel,
  saving,
  error,
}: {
  initial: CreateAddressInput;
  onSave: (data: CreateAddressInput) => void;
  onCancel: () => void;
  saving: boolean;
  error: string | null;
}) {
  const [form, setForm] = useState<CreateAddressInput>(initial);

  function set(field: keyof CreateAddressInput, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave(form);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={LABEL_CLS}>Label</label>
          <input
            type="text"
            value={form.label ?? ""}
            onChange={(e) => set("label", e.target.value)}
            className={INPUT_CLS}
            placeholder="Home, Office…"
            maxLength={50}
          />
        </div>
        <div>
          <label className={LABEL_CLS}>Full name *</label>
          <input
            type="text"
            value={form.fullName}
            onChange={(e) => set("fullName", e.target.value)}
            className={INPUT_CLS}
            placeholder="Jane Doe"
            required
            autoComplete="name"
          />
        </div>
        <div className="sm:col-span-2">
          <label className={LABEL_CLS}>Address line 1 *</label>
          <input
            type="text"
            value={form.line1}
            onChange={(e) => set("line1", e.target.value)}
            className={INPUT_CLS}
            placeholder="123 Main St"
            required
            autoComplete="address-line1"
          />
        </div>
        <div className="sm:col-span-2">
          <label className={LABEL_CLS}>Address line 2</label>
          <input
            type="text"
            value={form.line2 ?? ""}
            onChange={(e) => set("line2", e.target.value)}
            className={INPUT_CLS}
            placeholder="Apt 4 (optional)"
            autoComplete="address-line2"
          />
        </div>
        <div>
          <label className={LABEL_CLS}>City *</label>
          <input
            type="text"
            value={form.city}
            onChange={(e) => set("city", e.target.value)}
            className={INPUT_CLS}
            placeholder="Tallinn"
            required
            autoComplete="address-level2"
          />
        </div>
        <div>
          <label className={LABEL_CLS}>State / Region *</label>
          <input
            type="text"
            value={form.stateOrRegion}
            onChange={(e) => set("stateOrRegion", e.target.value)}
            className={INPUT_CLS}
            placeholder="Harju"
            required
            autoComplete="address-level1"
          />
        </div>
        <div>
          <label className={LABEL_CLS}>Postal code *</label>
          <input
            type="text"
            value={form.postalCode}
            onChange={(e) => set("postalCode", e.target.value)}
            className={INPUT_CLS}
            placeholder="10001"
            required
            autoComplete="postal-code"
          />
        </div>
        <div>
          <label className={LABEL_CLS}>Country *</label>
          <Select
            value={form.country}
            onValueChange={(v) => set("country", v)}
          >
            <SelectTrigger className="min-h-[40px] w-full px-3 py-2 text-sm">
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="sm:col-span-2">
          <label className={LABEL_CLS}>Phone</label>
          <input
            type="tel"
            value={form.phone ?? ""}
            onChange={(e) => set("phone", e.target.value)}
            className={INPUT_CLS}
            placeholder="+372 5000 0000 (optional)"
            autoComplete="tel"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-4 border-t border-white/10 pt-3">
        <label className="flex cursor-pointer items-center gap-2 text-xs text-white/70 hover:text-white">
          <input
            type="checkbox"
            checked={!!form.isDefaultShipping}
            onChange={(e) => set("isDefaultShipping", e.target.checked)}
            className="accent-[#FF4D00]"
          />
          Default shipping
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-xs text-white/70 hover:text-white">
          <input
            type="checkbox"
            checked={!!form.isDefaultBilling}
            onChange={(e) => set("isDefaultBilling", e.target.checked)}
            className="accent-[#FF4D00]"
          />
          Default billing
        </label>
      </div>

      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={saving}
          className="flex min-h-[36px] items-center gap-2 rounded-md bg-[#FF4D00] px-4 py-2 text-xs font-medium uppercase tracking-wider text-white hover:bg-[#FF4D00]/90 disabled:opacity-60"
        >
          <Check className="size-3.5" />
          {saving ? "Saving…" : "Save address"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="flex min-h-[36px] items-center gap-2 rounded-md border border-white/20 px-4 py-2 text-xs uppercase tracking-wider text-white/70 hover:bg-white/5 disabled:opacity-60"
        >
          <X className="size-3.5" />
          Cancel
        </button>
      </div>
    </form>
  );
}

function AddressCard({
  address,
  onEdit,
  onDelete,
  onSetDefaultShipping,
  onSetDefaultBilling,
  actionLoading,
}: {
  address: SavedAddress;
  onEdit: () => void;
  onDelete: () => void;
  onSetDefaultShipping: () => void;
  onSetDefaultBilling: () => void;
  actionLoading: boolean;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-4">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {address.label.toLowerCase().includes("office") ||
          address.label.toLowerCase().includes("work") ? (
            <Briefcase className="size-4 shrink-0 text-white/40" />
          ) : (
            <Home className="size-4 shrink-0 text-white/40" />
          )}
          <span className="text-sm font-medium text-white">{address.label}</span>
        </div>
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={onEdit}
            disabled={actionLoading}
            className="flex h-7 w-7 items-center justify-center rounded text-white/50 hover:bg-white/10 hover:text-white disabled:opacity-40"
            aria-label="Edit address"
          >
            <Pencil className="size-3.5" />
          </button>
          {!confirmDelete ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              disabled={actionLoading}
              className="flex h-7 w-7 items-center justify-center rounded text-white/50 hover:bg-red-500/20 hover:text-red-400 disabled:opacity-40"
              aria-label="Delete address"
            >
              <Trash2 className="size-3.5" />
            </button>
          ) : (
            <div className="flex items-center gap-1 rounded border border-red-500/30 bg-red-500/10 px-2">
              <span className="text-[10px] text-red-300">Delete?</span>
              <button
                type="button"
                onClick={() => { setConfirmDelete(false); onDelete(); }}
                disabled={actionLoading}
                className="text-[10px] text-red-300 hover:text-red-200 disabled:opacity-40"
              >
                Yes
              </button>
              <span className="text-white/30">/</span>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="text-[10px] text-white/60 hover:text-white"
              >
                No
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mb-3 space-y-0.5 text-sm text-white/70">
        <p>{address.fullName}</p>
        <p>{address.line1}{address.line2 ? `, ${address.line2}` : ""}</p>
        <p>{address.city}, {address.stateOrRegion} {address.postalCode}</p>
        <p>{COUNTRIES.find((c) => c.code === address.country)?.name ?? address.country}</p>
        {address.phone && <p className="text-white/50">{address.phone}</p>}
      </div>

      <div className="flex flex-wrap gap-2">
        {address.isDefaultShipping ? (
          <span className="flex items-center gap-1 rounded bg-[#FF4D00]/20 px-2 py-0.5 text-[10px] uppercase tracking-wider text-[#FF4D00]">
            <Check className="size-2.5" />
            Default shipping
          </span>
        ) : (
          <button
            type="button"
            onClick={onSetDefaultShipping}
            disabled={actionLoading}
            className="rounded border border-white/15 px-2 py-0.5 text-[10px] uppercase tracking-wider text-white/50 hover:border-[#FF4D00]/40 hover:text-[#FF4D00]/70 disabled:opacity-40"
          >
            Set shipping default
          </button>
        )}
        {address.isDefaultBilling ? (
          <span className="flex items-center gap-1 rounded bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-white/70">
            <Check className="size-2.5" />
            Default billing
          </span>
        ) : (
          <button
            type="button"
            onClick={onSetDefaultBilling}
            disabled={actionLoading}
            className="rounded border border-white/15 px-2 py-0.5 text-[10px] uppercase tracking-wider text-white/50 hover:border-white/30 hover:text-white/70 disabled:opacity-40"
          >
            Set billing default
          </button>
        )}
      </div>
    </div>
  );
}

export function AddressesSection() {
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchMyAddresses()
      .then((data) => { if (!cancelled) { setAddresses(data); setLoaded(true); } })
      .catch((err) => { if (!cancelled) { setLoadError(err.message); setLoaded(true); } });
    return () => { cancelled = true; };
  }, []);

  async function handleCreate(data: CreateAddressInput) {
    setSaving(true);
    setSaveError(null);
    try {
      const created = await createAddress(data);
      setAddresses((prev) => {
        const next = [created, ...prev.map((a) => ({
          ...a,
          isDefaultShipping: data.isDefaultShipping ? false : a.isDefaultShipping,
          isDefaultBilling: data.isDefaultBilling ? false : a.isDefaultBilling,
        }))];
        // If first address, no need to clear defaults (service handles it)
        if (prev.length === 0) return [created];
        return next;
      });
      // Refresh to get accurate defaults from server
      const fresh = await fetchMyAddresses();
      setAddresses(fresh);
      setShowAddForm(false);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save address");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(id: string, data: CreateAddressInput) {
    setSaving(true);
    setSaveError(null);
    try {
      await updateAddress(id, data);
      const fresh = await fetchMyAddresses();
      setAddresses(fresh);
      setEditingId(null);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to update address");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setActionLoadingId(id);
    try {
      await deleteAddress(id);
      const fresh = await fetchMyAddresses();
      setAddresses(fresh);
    } catch {
      // Silently ignore — very unlikely to fail
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleSetDefaultShipping(id: string) {
    setActionLoadingId(id);
    try {
      await setDefaultShipping(id);
      const fresh = await fetchMyAddresses();
      setAddresses(fresh);
    } catch {
      // Silently ignore
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleSetDefaultBilling(id: string) {
    setActionLoadingId(id);
    try {
      await setDefaultBilling(id);
      const fresh = await fetchMyAddresses();
      setAddresses(fresh);
    } catch {
      // Silently ignore
    } finally {
      setActionLoadingId(null);
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
            <MapPin className="size-5 text-white/50" />
            Saved Addresses
          </h2>
          <p className="mt-0.5 text-sm text-white/60">Manage your shipping and billing addresses</p>
        </div>
        {!showAddForm && (
          <button
            type="button"
            onClick={() => { setShowAddForm(true); setEditingId(null); setSaveError(null); }}
            className="flex items-center gap-1.5 rounded-md border border-white/20 px-3 py-1.5 text-xs uppercase tracking-wider text-white/70 hover:bg-white/5 hover:text-white"
          >
            <Plus className="size-3.5" />
            Add address
          </button>
        )}
      </div>

      {!loaded ? (
        <p className="py-4 text-sm text-white/60">Loading addresses…</p>
      ) : loadError ? (
        <p className="py-4 text-sm text-red-400">{loadError}</p>
      ) : (
        <div className="space-y-4">
          {showAddForm && (
            <div className="rounded-lg border border-[#FF4D00]/20 bg-white/5 p-4">
              <p className="mb-4 text-xs font-medium uppercase tracking-wider text-[#FF4D00]">New address</p>
              <AddressForm
                initial={BLANK_FORM}
                onSave={handleCreate}
                onCancel={() => { setShowAddForm(false); setSaveError(null); }}
                saving={saving}
                error={saveError}
              />
            </div>
          )}

          {addresses.length === 0 && !showAddForm && (
            <div className="rounded-lg border border-dashed border-white/10 p-8 text-center">
              <MapPin className="mx-auto mb-2 size-8 text-white/20" />
              <p className="text-sm text-white/50">No saved addresses yet.</p>
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="mt-3 text-xs text-[#FF4D00] hover:underline"
              >
                Add your first address
              </button>
            </div>
          )}

          {addresses.map((addr) =>
            editingId === addr.id ? (
              <div key={addr.id} className="rounded-lg border border-[#FF4D00]/20 bg-white/5 p-4">
                <p className="mb-4 text-xs font-medium uppercase tracking-wider text-[#FF4D00]">Edit address</p>
                <AddressForm
                  initial={{
                    label: addr.label,
                    fullName: addr.fullName,
                    phone: addr.phone ?? "",
                    line1: addr.line1,
                    line2: addr.line2 ?? "",
                    city: addr.city,
                    stateOrRegion: addr.stateOrRegion,
                    postalCode: addr.postalCode,
                    country: addr.country,
                    isDefaultShipping: addr.isDefaultShipping,
                    isDefaultBilling: addr.isDefaultBilling,
                  }}
                  onSave={(data) => handleUpdate(addr.id, data)}
                  onCancel={() => { setEditingId(null); setSaveError(null); }}
                  saving={saving}
                  error={saveError}
                />
              </div>
            ) : (
              <AddressCard
                key={addr.id}
                address={addr}
                onEdit={() => { setEditingId(addr.id); setShowAddForm(false); setSaveError(null); }}
                onDelete={() => handleDelete(addr.id)}
                onSetDefaultShipping={() => handleSetDefaultShipping(addr.id)}
                onSetDefaultBilling={() => handleSetDefaultBilling(addr.id)}
                actionLoading={actionLoadingId === addr.id}
              />
            )
          )}
        </div>
      )}
    </div>
  );
}
