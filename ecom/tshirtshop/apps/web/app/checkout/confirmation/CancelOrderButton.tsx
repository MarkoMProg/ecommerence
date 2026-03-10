"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cancelOrder } from "@/lib/api/orders";

interface CancelOrderButtonProps {
  orderId: string;
  status: string;
}

export function CancelOrderButton({ orderId, status }: CancelOrderButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const canCancel = status === "pending" || status === "paid";
  if (!canCancel) return null;

  async function handleCancel() {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const result = await cancelOrder(orderId);
      if (result) {
        setConfirming(false);
        router.refresh();
      } else {
        setError("Could not cancel order");
      }
    } catch {
      setError("Could not cancel order");
    } finally {
      setLoading(false);
    }
  }

  if (confirming) {
    return (
      <div className="mt-6 flex flex-col items-center gap-3">
        <p className="text-sm text-white/80">Are you sure you want to cancel this order?</p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setConfirming(false)}
            disabled={loading}
            className="rounded-md border border-white/20 px-4 py-2 text-sm font-medium text-white transition-colors hover:border-white/40 disabled:opacity-50"
          >
            No
          </button>
          <button
            type="button"
            onClick={handleCancel}
            disabled={loading}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? "Cancelling…" : "Yes, cancel order"}
          </button>
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>
    );
  }

  return (
    <div className="mt-6 flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={() => setConfirming(true)}
        disabled={loading}
        className="text-sm text-white/60 underline transition-colors hover:text-red-400 disabled:opacity-50"
      >
        Cancel this order
      </button>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
