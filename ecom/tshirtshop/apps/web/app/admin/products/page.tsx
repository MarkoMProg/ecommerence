"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Archive, ArchiveRestore } from "lucide-react";
import {
  fetchAdminProducts,
  adminDeleteProduct,
  adminSetProductArchived,
  type AdminProduct,
} from "@/lib/api/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProduct[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [archiving, setArchiving] = useState<string | null>(null);
  const [actionError, setActionError] = useState<{ id: string; message: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchAdminProducts().then((data) => {
      if (!cancelled) {
        setProducts(data);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, []);

  const handleDelete = async (id: string, name: string) => {
    setActionError(null);
    if (!confirm(`Permanently delete "${name}"? This cannot be undone.`)) return;
    setDeleting(id);
    const result = await adminDeleteProduct(id);
    setDeleting(null);
    if (result.success) {
      setProducts((prev) => prev?.filter((p) => p.id !== id) ?? prev);
    } else if (result.conflict) {
      setActionError({
        id,
        message: `Cannot delete — this product is part of existing orders. Archive it instead to hide it from the store.`,
      });
    } else {
      setActionError({ id, message: result.message });
    }
  };

  const handleArchiveToggle = async (product: AdminProduct) => {
    setActionError(null);
    const newState = !product.isArchived;
    const label = newState ? "archive" : "unarchive";
    if (!confirm(`${label.charAt(0).toUpperCase() + label.slice(1)} "${product.name}"?`)) return;
    setArchiving(product.id);
    const ok = await adminSetProductArchived(product.id, newState);
    setArchiving(null);
    if (ok) {
      setProducts((prev) =>
        prev?.map((p) => (p.id === product.id ? { ...p, isArchived: newState } : p)) ?? prev
      );
    } else {
      setActionError({ id: product.id, message: `Failed to ${label} product.` });
    }
  };

  const filtered = products?.filter((p) => {
    if (!showArchived && p.isArchived) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      (p.category?.name ?? "").toLowerCase().includes(q)
    );
  });

  if (loading) return <p className="py-8 text-white/60">Loading products…</p>;

  if (products === null) {
    return (
      <p className="py-8 text-white/60">
        Unable to load products. Check backend connectivity.
      </p>
    );
  }

  const archivedCount = products.filter((p) => p.isArchived).length;

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1
          className="text-2xl font-bold uppercase tracking-tight text-white sm:text-4xl"
          style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
        >
          Products
        </h1>
        <div className="flex flex-wrap gap-3">
          <Input
            placeholder="Search name, brand, category…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-56 bg-white/5"
          />
          <Button asChild variant="outline">
            <Link href="/admin/products/bulk">Bulk Upload</Link>
          </Button>
          <Button
            asChild
            className="bg-[#FF4D00] font-medium uppercase tracking-wider text-white hover:bg-[#FF4D00]/90"
          >
            <Link href="/admin/products/new">+ New Product</Link>
          </Button>
        </div>
      </div>

      {/* Archive filter toggle */}
      {archivedCount > 0 && (
        <div className="mb-4">
          <button
            type="button"
            onClick={() => setShowArchived((v) => !v)}
            className="flex items-center gap-2 text-xs text-white/50 transition-colors hover:text-white/80"
          >
            <Archive className="size-3.5" strokeWidth={1.5} />
            {showArchived
              ? `Hide ${archivedCount} archived product${archivedCount !== 1 ? "s" : ""}`
              : `Show ${archivedCount} archived product${archivedCount !== 1 ? "s" : ""}`}
          </button>
        </div>
      )}

      {(filtered?.length ?? 0) === 0 ? (
        <p className="py-8 text-white/60">
          {search.trim() ? "No products match your search." : "No products yet."}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-white/10">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="border-b border-white/10 bg-white/5">
              <tr>
                <th className="px-4 py-3 font-medium text-white">Product</th>
                <th className="px-4 py-3 font-medium text-white">Brand</th>
                <th className="px-4 py-3 font-medium text-white">Category</th>
                <th className="px-4 py-3 font-medium text-white">Price</th>
                <th className="px-4 py-3 font-medium text-white">Stock</th>
                <th className="px-4 py-3 font-medium text-white">Status</th>
                <th className="px-4 py-3 font-medium text-white">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filtered?.map((product) => (
                <>
                  <tr
                    key={product.id}
                    className={product.isArchived ? "bg-white/[0.02] opacity-60" : "bg-[#1A1A1A]/50"}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {product.images?.[0]?.imageUrl ? (
                          <img
                            src={product.images[0].imageUrl}
                            alt={product.name}
                            className="h-10 w-10 rounded object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded bg-white/10 text-xs text-white/40">
                            No img
                          </div>
                        )}
                        <Link
                          href={`/admin/products/${product.id}`}
                          className="font-medium text-[#FF4D00] hover:underline"
                        >
                          {product.name}
                        </Link>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-white/80">{product.brand}</td>
                    <td className="px-4 py-3 text-white/80">
                      {product.category?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 font-medium text-[#E6C068]">
                      ${(product.priceCents / 100).toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          product.stockQuantity <= 0
                            ? "text-red-400"
                            : product.stockQuantity <= 5
                              ? "text-yellow-400"
                              : "text-green-400"
                        }
                      >
                        {product.stockQuantity}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {product.isArchived ? (
                        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/50">
                          Archived
                        </span>
                      ) : product.stockQuantity <= 0 ? (
                        <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-red-400">
                          Out of Stock
                        </span>
                      ) : (
                        <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-green-400">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/admin/products/${product.id}`}>Edit</Link>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleArchiveToggle(product)}
                          disabled={archiving === product.id}
                          className="border-white/20 text-white/60 hover:bg-white/5"
                          title={product.isArchived ? "Unarchive product" : "Archive product"}
                        >
                          {archiving === product.id ? (
                            "…"
                          ) : product.isArchived ? (
                            <ArchiveRestore className="size-3.5" strokeWidth={1.5} />
                          ) : (
                            <Archive className="size-3.5" strokeWidth={1.5} />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(product.id, product.name)}
                          disabled={deleting === product.id}
                          className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                        >
                          {deleting === product.id ? "…" : "Delete"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                  {/* Inline error below the row */}
                  {actionError?.id === product.id && (
                    <tr key={`${product.id}-err`} className="bg-red-500/5">
                      <td
                        colSpan={7}
                        className="px-4 py-2 text-xs text-red-300"
                      >
                        {actionError.message}
                        {actionError.message.includes("Archive") && (
                          <button
                            type="button"
                            onClick={() => { setActionError(null); handleArchiveToggle(product); }}
                            className="ml-2 underline hover:text-red-200"
                          >
                            Archive now
                          </button>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-4 text-xs text-white/40">
        {filtered?.length ?? 0} of {products.length} products shown
        {archivedCount > 0 && !showArchived && ` (${archivedCount} archived hidden)`}
      </p>
    </>
  );
}
