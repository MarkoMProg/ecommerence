"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { fetchCategories } from "@/lib/api/catalog";
import type { ApiCategory } from "@/lib/api/catalog";
import {
  fetchAdminProduct,
  adminUpdateProduct,
  adminUploadImage,
  type AdminProduct,
} from "@/lib/api/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ImageEntry {
  url: string;
  uploading: boolean;
}

// ─── Shared components ────────────────────────────────────────────────────────

function FormField(props: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label htmlFor={props.id} className="text-white/80">
        {props.label}
      </Label>
      <div className="mt-1">{props.children}</div>
    </div>
  );
}

function ImageManager({
  images,
  onChange,
}: {
  images: ImageEntry[];
  onChange: (images: ImageEntry[]) => void;
}) {
  const fileInputs = useRef<(HTMLInputElement | null)[]>([]);

  const update = (index: number, patch: Partial<ImageEntry>) =>
    onChange(images.map((img, i) => (i === index ? { ...img, ...patch } : img)));

  const remove = (index: number) =>
    onChange(images.filter((_, i) => i !== index));

  const add = () =>
    onChange([...images, { url: "", uploading: false }]);

  const handleFile = async (index: number, file: File) => {
    update(index, { uploading: true, url: "" });
    const url = await adminUploadImage(file);
    update(index, { uploading: false, url: url ?? "" });
  };

  return (
    <div className="space-y-3">
      {images.map((img, i) => (
        <div key={i} className="rounded-lg border border-white/10 bg-white/5 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-white/50">
                Image {i + 1}
              </span>
              {i === 0 && (
                <span className="rounded-full bg-[#FF4D00]/20 px-2 py-0.5 text-[10px] font-bold text-[#FF4D00]">
                  PRIMARY
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => remove(i)}
              className="text-xs text-white/30 hover:text-red-400 transition-colors"
            >
              Remove
            </button>
          </div>

          <div className="flex gap-3 items-start">
            <div className="flex-shrink-0 h-20 w-20 rounded border border-white/10 overflow-hidden bg-white/5 flex items-center justify-center">
              {img.uploading ? (
                <span className="text-xs text-white/40 animate-pulse">Uploading…</span>
              ) : img.url ? (
                <img
                  src={img.url}
                  alt={`Product image ${i + 1}`}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23ffffff30' d='M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z'/%3E%3C/svg%3E";
                  }}
                />
              ) : (
                <svg className="h-8 w-8 text-white/20" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
                </svg>
              )}
            </div>

            <div className="flex-1 space-y-2">
              <div className="flex gap-2">
                <Input
                  value={img.url}
                  onChange={(e) => update(i, { url: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                  className="bg-white/5 text-sm font-mono"
                  disabled={img.uploading}
                />
                <button
                  type="button"
                  onClick={() => fileInputs.current[i]?.click()}
                  disabled={img.uploading}
                  className="shrink-0 rounded-md border border-white/20 bg-white/5 px-3 py-2 text-xs text-white/70 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-40"
                >
                  {img.uploading ? "…" : "Upload"}
                </button>
                <input
                  ref={(el) => { fileInputs.current[i] = el; }}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFile(i, file);
                    e.target.value = "";
                  }}
                />
              </div>

            </div>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={add}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-white/20 py-3 text-sm text-white/40 transition-colors hover:border-white/40 hover:text-white/70"
      >
        <Plus className="size-4" />
        Add image
      </button>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────────

export default function AdminEditProductPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [product, setProduct] = useState<AdminProduct | null>(null);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<ImageEntry[]>([]);
  const [form, setForm] = useState({
    name: "",
    description: "",
    priceCents: "",
    stockQuantity: "0",
    categoryId: "",
    brand: "",
    weightMetric: "",
    weightImperial: "",
    dimensionMetric: "",
    dimensionImperial: "",
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
            weightMetric: p.weightMetric ?? "",
            weightImperial: p.weightImperial ?? "",
            dimensionMetric: p.dimensionMetric ?? "",
            dimensionImperial: p.dimensionImperial ?? "",
          });
          setImages(
            p.images.map((img) => ({
              url: img.imageUrl,
              uploading: false,
            }))
          );
        }
      }
    );
  }, [id]);

  const set =
    (key: keyof typeof form) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >
    ) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

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
    if (images.some((img) => img.uploading))
      return setError("Please wait for all images to finish uploading.");

    const validImages = images.filter((img) => img.url.trim());
    setSubmitting(true);
    const result = await adminUpdateProduct(product.id, {
      name: form.name.trim(),
      description: form.description.trim(),
      priceCents: price,
      stockQuantity: stock,
      categoryId: form.categoryId,
      brand: form.brand.trim(),
      weightMetric: form.weightMetric.trim() || undefined,
      weightImperial: form.weightImperial.trim() || undefined,
      dimensionMetric: form.dimensionMetric.trim() || undefined,
      dimensionImperial: form.dimensionImperial.trim() || undefined,
      images: validImages.map((img) => ({
        url: img.url.trim(),
      })),
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
      <div className="mb-8 flex items-center justify-between">
        <h1
          className="text-2xl font-bold uppercase tracking-tight text-white sm:text-4xl"
          style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
        >
          Edit Product
        </h1>
        <Button variant="outline" asChild>
          <Link href="/admin/products">Cancel</Link>
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 pb-16">
        {error && (
          <div className="rounded border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {/* ── Core details ── */}
        <Card className="border-white/10 bg-[#1A1A1A]">
          <CardHeader>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white/60">
              Core Details
            </h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField id="name" label="Product Name *">
              <Input
                id="name"
                value={form.name}
                onChange={set("name")}
                className="bg-white/5"
                required
              />
            </FormField>

            <FormField id="description" label="Description *">
              <textarea
                id="description"
                value={form.description}
                onChange={set("description")}
                rows={5}
                className="w-full rounded-md border border-white/20 bg-white/5 px-3 py-2 text-sm text-white"
                required
              />
            </FormField>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField id="category" label="Category *">
                <select
                  id="category"
                  value={form.categoryId}
                  onChange={set("categoryId")}
                  className="w-full rounded-md border border-white/20 bg-[#0A0A0A] px-3 py-2 text-sm text-white [color-scheme:dark]"
                  required
                >
                  <option value="">Select category…</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField id="brand" label="Brand *">
                <Input
                  id="brand"
                  value={form.brand}
                  onChange={set("brand")}
                  className="bg-white/5"
                  required
                />
              </FormField>
            </div>
          </CardContent>
        </Card>

        {/* ── Pricing & inventory ── */}
        <Card className="border-white/10 bg-[#1A1A1A]">
          <CardHeader>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white/60">
              Pricing &amp; Inventory
            </h2>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FormField id="price" label="Price (USD) *">
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={form.priceCents}
                onChange={set("priceCents")}
                className="bg-white/5"
              />
            </FormField>
            <FormField id="stock" label="Stock Quantity">
              <Input
                id="stock"
                type="number"
                min="0"
                value={form.stockQuantity}
                onChange={set("stockQuantity")}
                className="bg-white/5"
              />
            </FormField>
          </CardContent>
        </Card>

        {/* ── Shipping / dimensions ── */}
        <Card className="border-white/10 bg-[#1A1A1A]">
          <CardHeader>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white/60">
              Shipping &amp; Dimensions{" "}
              <span className="font-normal normal-case text-white/30">(optional)</span>
            </h2>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FormField id="weightMetric" label="Weight (metric)">
              <Input id="weightMetric" value={form.weightMetric} onChange={set("weightMetric")} placeholder="e.g. 200g" className="bg-white/5" />
            </FormField>
            <FormField id="weightImperial" label="Weight (imperial)">
              <Input id="weightImperial" value={form.weightImperial} onChange={set("weightImperial")} placeholder="e.g. 7oz" className="bg-white/5" />
            </FormField>
            <FormField id="dimensionMetric" label="Dimensions (metric)">
              <Input id="dimensionMetric" value={form.dimensionMetric} onChange={set("dimensionMetric")} placeholder="e.g. 30×20×2 cm" className="bg-white/5" />
            </FormField>
            <FormField id="dimensionImperial" label="Dimensions (imperial)">
              <Input id="dimensionImperial" value={form.dimensionImperial} onChange={set("dimensionImperial")} placeholder='e.g. 12×8×0.8"' className="bg-white/5" />
            </FormField>
          </CardContent>
        </Card>

        {/* ── Images ── */}
        <Card className="border-white/10 bg-[#1A1A1A]">
          <CardHeader>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white/60">
              Product Images{" "}
              <span className="font-normal normal-case text-white/30">
                (first image will be primary)
              </span>
            </h2>
          </CardHeader>
          <CardContent>
            <ImageManager images={images} onChange={setImages} />
          </CardContent>
        </Card>

        {/* ── Actions ── */}
        <div className="flex gap-3">
          <Button type="submit" disabled={submitting}>
            {submitting ? "Saving…" : "Save Changes"}
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/products">Cancel</Link>
          </Button>
        </div>
      </form>
    </>
  );
}
