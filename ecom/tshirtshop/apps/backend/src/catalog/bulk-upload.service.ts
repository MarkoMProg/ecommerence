import { Injectable } from '@nestjs/common';
import { validateCreateProduct, type CreateProductBody } from './dto/catalog.dto';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BulkProductEntry {
  name: string;
  description: string;
  priceCents: number;
  stockQuantity?: number;
  categoryId: string;
  brand: string;
  weightMetric?: string;
  weightImperial?: string;
  dimensionMetric?: string;
  dimensionImperial?: string;
  images?: { url: string }[];
}

export interface BulkRowResult {
  row: number;
  name: string;
  status: 'created' | 'error';
  productId?: string;
  error?: string;
}

export interface BulkUploadResult {
  total: number;
  succeeded: number;
  failed: number;
  results: BulkRowResult[];
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class BulkUploadService {
  // ── CSV ──────────────────────────────────────────────────────────────────

  /** Parse a CSV string into BulkProductEntry[]. First row must be headers. */
  parseCSV(content: string): BulkProductEntry[] {
    const lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
    if (lines.length < 2) return [];

    const headers = this.parseCSVRow(lines[0]).map((h) => h.trim().toLowerCase());
    const entries: BulkProductEntry[] = [];

    for (let i = 1; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      if (!trimmed) continue;

      const values = this.parseCSVRow(lines[i]);
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => {
        row[h] = values[idx]?.trim() ?? '';
      });

      entries.push({
        name: row['name'] ?? '',
        description: row['description'] ?? '',
        priceCents: parseInt(row['pricecents'] ?? '0', 10),
        stockQuantity: row['stockquantity'] ? parseInt(row['stockquantity'], 10) : undefined,
        categoryId: row['categoryid'] ?? '',
        brand: row['brand'] ?? '',
        weightMetric: row['weightmetric'] || undefined,
        weightImperial: row['weightimperial'] || undefined,
        dimensionMetric: row['dimensionmetric'] || undefined,
        dimensionImperial: row['dimensionimperial'] || undefined,
        images: row['imageurls']
          ? row['imageurls']
              .split('|')
              .map((u) => u.trim())
              .filter(Boolean)
              .map((url) => ({ url }))
          : undefined,
      });
    }

    return entries;
  }

  // ── JSON ─────────────────────────────────────────────────────────────────

  /** Parse a JSON string (array of product objects) into BulkProductEntry[]. */
  parseJSON(content: string): BulkProductEntry[] {
    const data = JSON.parse(content);
    if (!Array.isArray(data)) {
      throw new Error('JSON must be an array of product objects');
    }

    return data.map((item: Record<string, unknown>) => ({
      name: String(item.name ?? ''),
      description: String(item.description ?? ''),
      priceCents: Number(item.priceCents ?? 0),
      stockQuantity: item.stockQuantity != null ? Number(item.stockQuantity) : undefined,
      categoryId: String(item.categoryId ?? ''),
      brand: String(item.brand ?? ''),
      weightMetric: item.weightMetric ? String(item.weightMetric) : undefined,
      weightImperial: item.weightImperial ? String(item.weightImperial) : undefined,
      dimensionMetric: item.dimensionMetric ? String(item.dimensionMetric) : undefined,
      dimensionImperial: item.dimensionImperial ? String(item.dimensionImperial) : undefined,
      images: Array.isArray(item.images)
        ? (item.images as unknown[]).map((img) =>
            typeof img === 'string' ? { url: img } : { url: String((img as Record<string, unknown>).url ?? '') },
          )
        : Array.isArray(item.imageUrls)
          ? (item.imageUrls as string[]).map((url) => ({ url }))
          : undefined,
    }));
  }

  // ── Validation ───────────────────────────────────────────────────────────

  /** Validate a single entry against CreateProduct rules. Returns error message or null. */
  validateEntry(entry: BulkProductEntry): string | null {
    const body: CreateProductBody = {
      name: entry.name,
      description: entry.description,
      priceCents: entry.priceCents,
      stockQuantity: entry.stockQuantity,
      categoryId: entry.categoryId,
      brand: entry.brand,
      images: entry.images,
    };
    const errors = validateCreateProduct(body);
    if (errors.length > 0) {
      return errors.map((e) => `${e.field}: ${e.message}`).join('; ');
    }
    return null;
  }

  // ── Detect format ────────────────────────────────────────────────────────

  /** Detect whether the content is JSON or CSV. */
  detectFormat(filename: string, content: string): 'json' | 'csv' {
    if (filename.endsWith('.json')) return 'json';
    if (filename.endsWith('.csv')) return 'csv';
    // Fallback: try JSON parse
    const trimmed = content.trimStart();
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) return 'json';
    return 'csv';
  }

  // ── Internal CSV helpers ─────────────────────────────────────────────────

  /** Parse a single CSV row, respecting quoted fields. */
  private parseCSVRow(line: string): string[] {
    const fields: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"') {
          if (i + 1 < line.length && line[i + 1] === '"') {
            current += '"';
            i++; // skip escaped quote
          } else {
            inQuotes = false;
          }
        } else {
          current += ch;
        }
      } else {
        if (ch === '"') {
          inQuotes = true;
        } else if (ch === ',') {
          fields.push(current);
          current = '';
        } else {
          current += ch;
        }
      }
    }
    fields.push(current);
    return fields;
  }
}
