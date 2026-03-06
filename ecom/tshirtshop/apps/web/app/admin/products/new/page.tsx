"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { fetchCategories } from "@/lib/api/catalog";
import type { ApiCategory } from "@/lib/api/catalog";
import { adminCreateProduct, adminUploadImage } from "@/lib/api/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ImageEntry {
  /** Hosted URL — set after file upload or entered manually. */
  url: string;
  /** True while the file is being uploaded. */
  uploading: boolean;
}


interface FormState {
  name: string;
  description: string;
  price: string;
  stockQuantity: string;
  categoryId: string;
  brand: string;
  weightMetric: string;
  weightImperial: string;
  dimensionMetric: string;
  dimensionImperial: string;
}

const EMPTY_FORM: FormState = {
  name: "",
  description: "",
  price: "",
  stockQuantity: "0",
  categoryId: "",
  brand: "",
  weightMetric: "",
  weightImperial: "",
  dimensionMetric: "",
  dimensionImperial: "",
};

// ─── Form field wrapper ────────────────────────────────────────────────────────

function FormField(props: {
  id: string;
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label htmlFor={props.id} className="text-white/80">
        {props.label}
      </Label>
      {props.hint && <p className="mb-1 text-xs text-white/40">{props.hint}</p>}
      <div className="mt-1">{props.children}</div>
    </div>
  );
}

// ─── Image Manager ────────────────────────────────────────────────────────────

function ImageManager({
  images,
  onChange,
}: {
  images: ImageEntry[];
  onChange: (images: ImageEntry[]) => void;
}) {
  const fileInputs = useRef<(HTMLInputElement | null)[]>([]);

  const update = (index: number, patch: Partial<ImageEntry>) => {
    onChange(images.map((img, i) => (i === index ? { ...img, ...patch } : img)));
  };

  const remove = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  const add = () => {
    onChange([...images, { url: "", uploading: false }]);
  };

  const handleFile = async (index: number, file: File) => {
    update(index, { uploading: true, url: "" });
    const url = await adminUploadImage(file);
    update(index, { uploading: false, url: url ?? "" });
  };

  return (
    <div className="space-y-3">
      {images.map((img, i) => (
        <div
          key={i}
          className="rounded-lg border border-white/10 bg-white/5 p-4 space-y-3"
        >
          {/* Header row */}
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

          {/* Preview + upload */}
          <div className="flex gap-3 items-start">
            {/* Thumbnail */}
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
                <svg
                  className="h-8 w-8 text-white/20"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
                </svg>
              )}
            </div>

            {/* URL input + file picker */}
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

export default function AdminNewProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [images, setImages] = useState<ImageEntry[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories().then(setCategories);
  }, []);

  const set =
    (key: keyof FormState) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >
    ) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const price = Math.round(parseFloat(form.price) * 100);
    const stock = parseInt(form.stockQuantity, 10) || 0;

    if (!form.name.trim()) return setError("Name is required.");
    if (!form.description.trim()) return setError("Description is required.");
    if (!form.categoryId) return setError("Category is required.");
    if (!form.brand.trim()) return setError("Brand is required.");
    if (isNaN(price) || price < 0)
      return setError("Price must be a valid positive number.");
    if (stock < 0) return setError("Stock quantity cannot be negative.");

    if (images.some((img) => img.uploading))
      return setError("Please wait for all images to finish uploading.");

    const validImages = images.filter((img) => img.url.trim());
    setSubmitting(true);
    const result = await adminCreateProduct({
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
      images:
        validImages.length > 0
          ? validImages.map((img) => ({
              url: img.url.trim(),
            }))
          : undefined,
    });
    setSubmitting(false);

    if (result) {
      router.push("/admin/products");
    } else {
      setError(
        "Failed to create product. Check that all fields are valid and try again."
      );
    }
  };

  return (
    <>
      <div className="mb-8 flex items-center justify-between">
        <h1
          className="text-2xl font-bold uppercase tracking-tight text-white sm:text-4xl"
          style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
        >
          New Product
        </h1>
        <Button variant="outline" asChild className="border-white/20">
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
                placeholder="e.g. Infernal D20 Tee"
                className="bg-white/5"
                required
              />
            </FormField>

            <FormField id="description" label="Description *">
              <textarea
                id="description"
                value={form.description}
                onChange={set("description")}
                placeholder="Detailed product description…"
                rows={5}
                className="w-full rounded-md border border-white/20 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30"
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
                  placeholder="e.g. Darkloom"
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
                value={form.price}
                onChange={set("price")}
                placeholder="e.g. 29.99"
                className="bg-white/5"
                required
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
              <Input
                id="weightMetric"
                value={form.weightMetric}
                onChange={set("weightMetric")}
                placeholder="e.g. 200g"
                className="bg-white/5"
              />
            </FormField>
            <FormField id="weightImperial" label="Weight (imperial)">
              <Input
                id="weightImperial"
                value={form.weightImperial}
                onChange={set("weightImperial")}
                placeholder="e.g. 7oz"
                className="bg-white/5"
              />
            </FormField>
            <FormField id="dimensionMetric" label="Dimensions (metric)">
              <Input
                id="dimensionMetric"
                value={form.dimensionMetric}
                onChange={set("dimensionMetric")}
                placeholder="e.g. 30×20×2 cm"
                className="bg-white/5"
              />
            </FormField>
            <FormField id="dimensionImperial" label="Dimensions (imperial)">
              <Input
                id="dimensionImperial"
                value={form.dimensionImperial}
                onChange={set("dimensionImperial")}
                placeholder='e.g. 12×8×0.8"'
                className="bg-white/5"
              />
            </FormField>
          </CardContent>
        </Card>

        {/* ── Images ── */}
        <Card className="border-white/10 bg-[#1A1A1A]">
          <CardHeader>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white/60">
              Product Images{" "}
              <span className="font-normal normal-case text-white/30">
                (optional — first image will be primary)
              </span>
            </h2>
          </CardHeader>
          <CardContent>
            <ImageManager images={images} onChange={setImages} />
          </CardContent>
        </Card>

        {/* ── Actions ── */}
        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={submitting}
            className="bg-[#FF4D00] font-medium uppercase tracking-wider text-white hover:bg-[#FF4D00]/90"
          >
            {submitting ? "Creating…" : "Create Product"}
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/products">Cancel</Link>
          </Button>
        </div>
      </form>
    </>
  );
}
