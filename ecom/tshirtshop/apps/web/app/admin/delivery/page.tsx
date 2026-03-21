"use client";

import { useEffect, useState } from "react";
import {
  fetchAdminDeliverySettings,
  putAdminDeliverySettings,
  type AdminDeliveryOption,
  type AdminDeliverySettings,
} from "@/lib/api/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function emptyOption(id: string, sortOrder: number): AdminDeliveryOption {
  return {
    id,
    label: "",
    priceCents: 599,
    sortOrder,
    active: true,
    isDefault: false,
  };
}

export default function AdminDeliveryPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [thresholdDollars, setThresholdDollars] = useState("75");
  const [options, setOptions] = useState<AdminDeliveryOption[]>([]);

  const load = () => {
    setLoading(true);
    setError(null);
    fetchAdminDeliverySettings().then((data) => {
      setLoading(false);
      if (!data) {
        setError("Failed to load delivery settings.");
        return;
      }
      setThresholdDollars((data.freeShippingThresholdCents / 100).toFixed(2));
      setOptions(
        data.options.length
          ? data.options
          : [emptyOption("standard", 0), emptyOption("express", 1)]
      );
    });
  };

  useEffect(() => {
    load();
  }, []);

  const setDefault = (id: string) => {
    setOptions((prev) =>
      prev.map((o) => ({ ...o, isDefault: o.id === id }))
    );
  };

  const updateOption = (
    id: string,
    patch: Partial<AdminDeliveryOption>
  ) => {
    setOptions((prev) =>
      prev.map((o) => (o.id === id ? { ...o, ...patch } : o))
    );
  };

  const addOption = () => {
    const nextId = `opt-${Date.now()}`;
    setOptions((prev) => [
      ...prev,
      emptyOption(nextId, prev.length),
    ]);
  };

  const removeOption = (id: string) => {
    setOptions((prev) => {
      const next = prev.filter((o) => o.id !== id);
      if (next.length && !next.some((o) => o.isDefault)) {
        const first = next[0];
        if (first) {
          next[0] = {
            id: first.id,
            label: first.label,
            priceCents: first.priceCents,
            sortOrder: first.sortOrder,
            active: first.active,
            isDefault: true,
          };
        }
      }
      return next;
    });
  };

  const handleSave = async () => {
    const threshold = Math.round(parseFloat(thresholdDollars) * 100);
    if (!Number.isFinite(threshold) || threshold < 0) {
      setError("Enter a valid free-shipping threshold (USD).");
      return;
    }
    for (const o of options) {
      if (!o.id.trim() || !o.label.trim()) {
        setError("Each option needs an ID and label.");
        return;
      }
      if (!Number.isFinite(o.priceCents) || o.priceCents < 0) {
        setError("Prices must be valid (cents).");
        return;
      }
    }
    if (!options.some((o) => o.isDefault)) {
      setError("Mark one option as default.");
      return;
    }

    const payload: AdminDeliverySettings = {
      freeShippingThresholdCents: threshold,
      options: options.map((o, i) => ({
        ...o,
        id: o.id.trim(),
        label: o.label.trim(),
        sortOrder: o.sortOrder ?? i,
      })),
    };

    setSaving(true);
    setError(null);
    const saved = await putAdminDeliverySettings(payload);
    setSaving(false);
    if (!saved) {
      setError("Save failed. Check that exactly one option is default and IDs are unique.");
      return;
    }
    setThresholdDollars((saved.freeShippingThresholdCents / 100).toFixed(2));
    setOptions(saved.options);
  };

  if (loading) {
    return (
      <div className="text-sm text-white/60">Loading delivery settings…</div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1
        className="mb-2 text-2xl font-bold uppercase tracking-tight text-white"
        style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
      >
        Delivery
      </h1>
      <p className="mb-8 text-sm text-white/60">
        Configure free-shipping threshold and shipping methods shown at checkout.
      </p>

      {error && (
        <div className="mb-6 rounded-md border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <section className="mb-10 rounded-lg border border-white/10 bg-white/5 p-6">
        <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-white/60">
          Free shipping — order subtotal at or above (USD)
        </label>
        <Input
          type="number"
          min={0}
          step="0.01"
          value={thresholdDollars}
          onChange={(e) => setThresholdDollars(e.target.value)}
          className="max-w-xs border-white/20 bg-white/5 text-white"
        />
        <p className="mt-2 text-xs text-white/40">
          Below this amount, the customer pays the selected delivery method unless a free-shipping coupon applies.
        </p>
      </section>

      <section className="mb-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-sm font-medium uppercase tracking-wider text-white/80">
            Delivery methods
          </h2>
          <Button type="button" variant="outline" size="sm" onClick={addOption}>
            Add method
          </Button>
        </div>

        <div className="space-y-4">
          {options.map((o, i) => (
            <div
              key={i}
              className="rounded-lg border border-white/10 bg-white/5 p-4"
            >
              <div className="mb-3 flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-2 text-sm text-white/80">
                  <input
                    type="radio"
                    name="default-delivery"
                    checked={o.isDefault}
                    onChange={() => setDefault(o.id)}
                    className="accent-[#FF4D00]"
                  />
                  Default at checkout
                </label>
                <label className="flex items-center gap-2 text-sm text-white/80">
                  <input
                    type="checkbox"
                    checked={o.active}
                    onChange={(e) =>
                      updateOption(o.id, { active: e.target.checked })
                    }
                    className="accent-[#FF4D00]"
                  />
                  Active
                </label>
                <button
                  type="button"
                  onClick={() => removeOption(o.id)}
                  className="text-xs text-red-400 hover:text-red-300"
                >
                  Remove
                </button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs text-white/50">ID (slug)</label>
                  <Input
                    value={o.id}
                    onChange={(e) => updateOption(o.id, { id: e.target.value })}
                    className="border-white/20 bg-white/5 font-mono text-sm text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-white/50">Label</label>
                  <Input
                    value={o.label}
                    onChange={(e) => updateOption(o.id, { label: e.target.value })}
                    className="border-white/20 bg-white/5 text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-white/50">Price (USD)</label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={(o.priceCents / 100).toFixed(2)}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      updateOption(o.id, {
                        priceCents: Number.isFinite(v) ? Math.round(v * 100) : 0,
                      });
                    }}
                    className="border-white/20 bg-white/5 text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-white/50">Sort order</label>
                  <Input
                    type="number"
                    value={o.sortOrder}
                    onChange={(e) =>
                      updateOption(o.id, {
                        sortOrder: parseInt(e.target.value, 10) || 0,
                      })
                    }
                    className="border-white/20 bg-white/5 text-white"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="bg-[#FF4D00] hover:bg-[#FF4D00]/90"
      >
        {saving ? "Saving…" : "Save delivery settings"}
      </Button>
    </div>
  );
}
