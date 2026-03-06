"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  fetchAdminProducts,
  adminDeleteProduct,
  type AdminProduct,
} from "@/lib/api/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProduct[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchAdminProducts().then((data) => {
      if (!cancelled) {
        setProducts(data);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setDeleting(id);
    const ok = await adminDeleteProduct(id);
    if (ok && products) {
      setProducts(products.filter((p) => p.id !== id));
    }
    setDeleting(null);
  };

  const filtered = products?.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.category?.name.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return <p className="py-8 text-white/60">Loading products…</p>;
  }

  if (products === null) {
    return (
      <p className="py-8 text-white/60">
        Unable to load products. Check backend connectivity.
      </p>
    );
  }

  return (
    <>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1
          className="text-2xl font-bold uppercase tracking-tight text-white sm:text-4xl"
          style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
        >
          Products
        </h1>
        <div className="flex gap-3">
          <Input
            placeholder="Search name, brand, category…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64 bg-white/5"
          />
          <Button asChild variant="outline">
            <Link href="/admin/products/bulk">Bulk Upload</Link>
          </Button>
          <Button asChild className="bg-[#FF4D00] font-medium uppercase tracking-wider text-white hover:bg-[#FF4D00]/90">
            <Link href="/admin/products/new">+ New Product</Link>
          </Button>
        </div>
      </div>

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
                <th className="px-4 py-3 font-medium text-white">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filtered?.map((product) => (
                <tr key={product.id} className="bg-[#1A1A1A]/50">
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
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/products/${product.id}`}>Edit</Link>
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
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-4 text-xs text-white/40">
        {filtered?.length ?? 0} of {products.length} products shown
      </p>
    </>
  );
}
