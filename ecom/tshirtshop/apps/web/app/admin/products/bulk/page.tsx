"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText } from "lucide-react";
import {
  adminBulkUploadProducts,
  type BulkUploadResult,
} from "@/lib/api/admin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

// ─── Field reference table ─────────────────────────────────────────────────

const FIELD_DOCS: { field: string; required: boolean; note: string }[] = [
  { field: "name", required: true, note: "Product name (max 255 chars)" },
  { field: "description", required: true, note: "Full product description" },
  { field: "priceCents", required: true, note: "Price in cents (e.g. 2999 = $29.99)" },
  { field: "stockQuantity", required: false, note: "Defaults to 0 if omitted" },
  { field: "categoryId", required: true, note: "Must match an existing category ID from your store (see Categories page)" },
  { field: "brand", required: true, note: "Brand name" },
  { field: "weightMetric", required: false, note: 'e.g. "200g"' },
  { field: "weightImperial", required: false, note: 'e.g. "7oz"' },
  { field: "dimensionMetric", required: false, note: 'e.g. "28×20×1 cm"' },
  { field: "dimensionImperial", required: false, note: 'e.g. "11×8×0.4\\""' },
  {
    field: "images / imageUrls",
    required: false,
    note: 'JSON: array of {url} objects or string[]. CSV: pipe-separated URLs in "imageUrls" column',
  },
];

export default function AdminBulkUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BulkUploadResult | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setResult(null);
    const f = e.target.files?.[0] ?? null;
    if (f && !f.name.endsWith(".csv") && !f.name.endsWith(".json")) {
      setError("Please select a .csv or .json file.");
      setFile(null);
      return;
    }
    setFile(f);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return setError("No file selected.");
    setError(null);
    setResult(null);
    setUploading(true);
    try {
      const data = await adminBulkUploadProducts(file);
      if (data) {
        setResult(data);
      } else {
        setError("Upload returned no data. Check the file format and try again.");
      }
    } catch (err) {
      setError((err as Error).message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1
          className="text-2xl font-bold uppercase tracking-tight text-white sm:text-4xl"
          style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
        >
          Bulk Upload Products
        </h1>
        <Button variant="outline" asChild>
          <Link href="/admin/products">Back to Products</Link>
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Left column: upload form */}
        <Card className="border-white/10 bg-[#1A1A1A]">
          <CardHeader>
            <h2 className="text-lg font-semibold text-white">Upload File</h2>
            <p className="text-sm text-white/50">
              Upload a <strong>.csv</strong> or <strong>.json</strong> file containing product data.
              Each row/entry creates a new product.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* File picker */}
              <div className="rounded-lg border-2 border-dashed border-white/20 p-8 text-center transition-colors hover:border-white/40">
                <input
                  type="file"
                  accept=".csv,.json"
                  onChange={handleFileChange}
                  className="hidden"
                  id="bulk-file"
                />
                <label
                  htmlFor="bulk-file"
                  className="cursor-pointer space-y-2 block"
                >
                  <FileText className="size-12 text-white/20" />
                  <p className="text-sm text-white/60">
                    {file ? (
                      <>
                        <span className="font-semibold text-[#FF4D00]">
                          {file.name}
                        </span>{" "}
                        ({(file.size / 1024).toFixed(1)} KB)
                      </>
                    ) : (
                      "Click to select a .csv or .json file"
                    )}
                  </p>
                </label>
              </div>

              {/* Download examples */}
              <div className="flex flex-wrap gap-3">
                <a
                  href="/examples/products-example.csv"
                  download
                  className="rounded-md border border-white/20 bg-white/5 px-3 py-1.5 text-xs text-white/60 hover:bg-white/10 hover:text-white transition-colors"
                >
                  Download CSV Example
                </a>
                <a
                  href="/examples/products-example.json"
                  download
                  className="rounded-md border border-white/20 bg-white/5 px-3 py-1.5 text-xs text-white/60 hover:bg-white/10 hover:text-white transition-colors"
                >
                  Download JSON Example
                </a>
              </div>

              {error && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={!file || uploading}
                className="w-full"
              >
                {uploading ? "Uploading…" : "Upload & Create Products"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Right column: field reference */}
        <Card className="border-white/10 bg-[#1A1A1A]">
          <CardHeader>
            <h2 className="text-lg font-semibold text-white">Field Reference</h2>
            <p className="text-sm text-white/50">
              Required and optional fields for each product entry.
            </p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-white/10">
                  <tr>
                    <th className="pb-2 font-medium text-white/70">Field</th>
                    <th className="pb-2 font-medium text-white/70">Required</th>
                    <th className="pb-2 font-medium text-white/70">Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {FIELD_DOCS.map((f) => (
                    <tr key={f.field}>
                      <td className="py-2 font-mono text-[#FF4D00]">
                        {f.field}
                      </td>
                      <td className="py-2">
                        {f.required ? (
                          <span className="text-red-400">Yes</span>
                        ) : (
                          <span className="text-white/30">No</span>
                        )}
                      </td>
                      <td className="py-2 text-white/50">{f.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 space-y-2 text-xs text-white/40">
              <div className="rounded-md border border-yellow-500/30 bg-yellow-500/10 px-3 py-2 text-yellow-200">
                <strong>Important:</strong> The <code className="text-[#FF4D00]">categoryId</code> field
                must be a real category ID from your store. The example files use a
                placeholder — replace it with an actual ID before uploading. You can
                find category IDs on the Categories page.
              </div>
              <p>
                <strong className="text-white/60">CSV tip:</strong> Use
                pipe-separated URLs in the <code className="text-[#FF4D00]">imageUrls</code> column
                (e.g. <code>url1|url2</code>). Wrap fields with commas in double quotes.
              </p>
              <p>
                <strong className="text-white/60">JSON tip:</strong> Provide an
                array of objects. Images can be{" "}
                <code className="text-[#FF4D00]">{"images: [{url: \"...\"}]"}</code> or{" "}
                <code className="text-[#FF4D00]">{"imageUrls: [\"...\"]"}</code>.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results */}
      {result && (
        <Card className="mt-8 border-white/10 bg-[#1A1A1A]">
          <CardHeader>
            <h2 className="text-lg font-semibold text-white">Upload Results</h2>
            <div className="flex gap-6 text-sm">
              <span className="text-white/50">
                Total: <span className="font-bold text-white">{result.total}</span>
              </span>
              <span className="text-green-400">
                Created: <span className="font-bold">{result.succeeded}</span>
              </span>
              {result.failed > 0 && (
                <span className="text-red-400">
                  Failed: <span className="font-bold">{result.failed}</span>
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 border-b border-white/10 bg-[#1A1A1A]">
                  <tr>
                    <th className="px-3 py-2 font-medium text-white/70">Row</th>
                    <th className="px-3 py-2 font-medium text-white/70">Name</th>
                    <th className="px-3 py-2 font-medium text-white/70">Status</th>
                    <th className="px-3 py-2 font-medium text-white/70">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {result.results.map((r) => (
                    <tr key={r.row}>
                      <td className="px-3 py-2 font-mono text-white/50">
                        {r.row}
                      </td>
                      <td className="px-3 py-2 text-white">{r.name}</td>
                      <td className="px-3 py-2">
                        {r.status === "created" ? (
                          <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-xs font-semibold text-green-400">
                            Created
                          </span>
                        ) : (
                          <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-semibold text-red-400">
                            Error
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-xs text-white/40">
                        {r.error ?? (r.productId ? `ID: ${r.productId}` : "")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
