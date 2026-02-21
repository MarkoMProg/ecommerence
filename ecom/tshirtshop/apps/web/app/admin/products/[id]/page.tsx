"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { fetchCategories } from "@/lib/api/catalog";
import type { ApiCategory } from "@/lib/api/catalog";
import {
  fetchAdminProduct,
  adminUpdateProduct,
  type AdminProduct,
} from "@/lib/api/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function AdminEditProductPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [product, setProduct] = useState<AdminProduct | null>(null);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    priceCents: "",
    stockQuantity: "0",
    categoryId: "",
    brand: "",
  });

  useEffect(() => {
    Promise.all([fetchAdminProduct(id), fetchCategories()]).then(
      ([p, cats]) => {
        setProduct(p ?? null);
        setCategories(cats);
        if (p) {
          setForm({
            name: p.name,
            description: p.description,
            priceCents: (p.priceCents / 100).toFixed(2),
            stockQuantity: String(p.stockQuantity),
            categoryId: p.categoryId,
            brand: p.brand,
          });
        }
      }
    );
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    setError(null);
    const price = Math.round(parseFloat(form.priceCents) * 100);
    const stock = parseInt(form.stockQuantity, 10) || 0;
    if (!form.name.trim() || !form.description.trim() || !form.categoryId || !form.brand.trim()) {
      setError("Name, description, category, and brand are required.");
      return;
    }
    if (isNaN(price) || price < 0) {
      setError("Price must be a valid positive number.");
      return;
    }
    setSubmitting(true);
    const result = await adminUpdateProduct(product.id, {
      name: form.name.trim(),
      description: form.description.trim(),
      priceCents: price,
      stockQuantity: stock,
      categoryId: form.categoryId,
      brand: form.brand.trim(),
    });
    setSubmitting(false);
    if (result) {
      router.push("/admin/products");
    } else {
      setError("Failed to update product.");
    }
  };

  if (!product) {
    return (
      <p className="py-8 text-white/60">
        Loading… or product not found.{" "}
        <Link href="/admin/products" className="text-[#FF4D00] hover:underline">
          Back to products
        </Link>
      </p>
    );
  }

  return (
    <>
      <h1
        className="mb-8 text-2xl font-bold uppercase tracking-tight text-white sm:text-4xl"
        style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
      >
        Edit Product
      </h1>
      <Card className="max-w-xl border-white/10 bg-[#1A1A1A]">
        <CardHeader>
          <h2 className="text-lg font-semibold text-white">{product.name}</h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <p className="rounded border border-red-500/50 bg-red-500/10 px-4 py-2 text-sm text-red-200">
                {error}
              </p>
            )}
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="mt-1 bg-white/5"
                required
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="mt-1 w-full rounded-md border border-white/20 bg-white/5 px-3 py-2 text-white"
                rows={4}
                required
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="price">Price (dollars)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.priceCents}
                  onChange={(e) => setForm((f) => ({ ...f, priceCents: e.target.value }))}
                  className="mt-1 bg-white/5"
                />
              </div>
              <div>
                <Label htmlFor="stock">Stock quantity</Label>
                <Input
                  id="stock"
                  type="number"
                  min="0"
                  value={form.stockQuantity}
                  onChange={(e) => setForm((f) => ({ ...f, stockQuantity: e.target.value }))}
                  className="mt-1 bg-white/5"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                value={form.categoryId}
                onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                className="mt-1 w-full rounded-md border border-white/20 bg-white/5 px-3 py-2 text-white [color-scheme:dark]"
                required
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="brand">Brand</Label>
              <Input
                id="brand"
                value={form.brand}
                onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}
                className="mt-1 bg-white/5"
                required
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving…" : "Save"}
              </Button>
              <Button variant="outline" asChild>
                <Link href="/admin/products">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
