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

  const canCancel = status === "pending" || status === "paid";
  if (!canCancel) return null;

  async function handleCancel() {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const result = await cancelOrder(orderId);
      if (result) {
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

  return (
    <div className="mt-6 flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={handleCancel}
        disabled={loading}
        className="text-sm text-white/60 underline transition-colors hover:text-red-400 disabled:opacity-50"
      >
        {loading ? "Cancelling…" : "Cancel this order"}
      </button>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
