import { Injectable, Inject, ConflictException } from '@nestjs/common';
import { eq, desc, asc, sql, and, or, ilike, gte, lte, type SQL } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { randomUUID } from 'crypto';
import { DATABASE_CONNECTION } from '../database/database-connection';
import { category, product, productImage } from './schema';

/**
 * Generate a URL-safe slug from a product name.
 * Appends a short random suffix to guarantee uniqueness.
 */
function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const suffix = randomUUID().slice(0, 6);
  return `${base}-${suffix}`;
}

type Category = typeof category.$inferSelect;
type Product = typeof product.$inferSelect;
type ProductImage = typeof productImage.$inferSelect;

export interface ProductImageEntry {
  url: string;
}

export interface CreateProductDto {
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
  images?: ProductImageEntry[];
}

export interface UpdateProductDto {
  name?: string;
  description?: string;
  priceCents?: number;
  stockQuantity?: number;
  categoryId?: string;
  brand?: string;
  weightMetric?: string;
  weightImperial?: string;
  dimensionMetric?: string;
  dimensionImperial?: string;
  /** When provided, replaces all existing product images. */
  images?: ProductImageEntry[];
}

export type ProductSortOption =
  | 'newest'
  | 'price-asc'
  | 'price-desc'
  | 'name-asc'
  | 'name-desc';

export interface ListProductsQuery {
  page?: number;
  limit?: number;
  category?: string;
  /** Search query: case-insensitive match on name and description */
  q?: string;
  /** Faceted filters */
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  /** Sort: newest (default), price-asc, price-desc, name-asc, name-desc */
  sort?: ProductSortOption;
}

/** Escape %, _, \ for safe use in ILIKE pattern */
function escapeIlikePattern(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
}

@Injectable()
export class CatalogService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: NodePgDatabase,
  ) {}

  async listCategories(): Promise<Category[]> {
    const rows = await this.db.select().from(category).orderBy(category.name);
    return rows;
  }

  /** Search suggestions for autocomplete: product names, category name+slug, brand names */
  async getSearchSuggestions(
    q: string,
    limit = 10,
  ): Promise<{
    products: string[];
    categories: { name: string; slug: string }[];
    brands: string[];
  }> {
    const trimmed = q?.trim() ?? '';
    if (trimmed.length < 2) {
      return { products: [], categories: [], brands: [] };
    }
    const pattern = `%${escapeIlikePattern(trimmed)}%`;
    const perType = Math.max(1, Math.ceil(limit / 3));

    const [productRows, categoryRows, brandRows] = await Promise.all([
      this.db
        .selectDistinct({ name: product.name })
        .from(product)
        .where(ilike(product.name, pattern))
        .limit(perType)
        .orderBy(product.name),
      this.db
        .select({ name: category.name, slug: category.slug })
        .from(category)
        .where(ilike(category.name, pattern))
        .limit(perType)
        .orderBy(category.name),
      this.db
        .selectDistinct({ brand: product.brand })
        .from(product)
        .where(ilike(product.brand, pattern))
        .limit(perType)
        .orderBy(product.brand),
    ]);

    return {
      products: productRows.map((r) => r.name),
      categories: categoryRows.map((r) => ({ name: r.name, slug: r.slug })),
      brands: brandRows.map((r) => r.brand),
    };
  }

  /** Distinct brands for faceted filter UI */
  async getDistinctBrands(): Promise<string[]> {
    const rows = await this.db
      .selectDistinct({ brand: product.brand })
      .from(product)
      .orderBy(product.brand);
    return rows.map((r) => r.brand);
  }

  async getCategoryById(id: string): Promise<Category | null> {
    const [row] = await this.db.select().from(category).where(eq(category.id, id));
    return row ?? null;
  }

  async getCategoryBySlug(slug: string): Promise<Category | null> {
    const [row] = await this.db.select().from(category).where(eq(category.slug, slug));
    return row ?? null;
  }

  async listProducts(query: ListProductsQuery = {}): Promise<{
    data: (Product & { images: ProductImage[]; category: Category | null })[];
    pagination: { page: number; limit: number; total: number };
  }> {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(50, Math.max(1, query.limit ?? 20));
    const offset = (page - 1) * limit;

    const conditions: SQL[] = [];
    if (query.category) {
      const cat = await this.getCategoryBySlug(query.category);
      if (cat) {
        conditions.push(eq(product.categoryId, cat.id));
      }
    }
    if (query.q && query.q.trim().length > 0) {
      const pattern = `%${escapeIlikePattern(query.q.trim())}%`;
      conditions.push(
        or(ilike(product.name, pattern), ilike(product.description, pattern))!,
      );
    }
    if (query.brand && query.brand.trim().length > 0) {
      conditions.push(eq(product.brand, query.brand.trim()));
    }
    if (query.minPrice != null && query.minPrice >= 0) {
      conditions.push(gte(product.priceCents, Math.round(query.minPrice * 100)));
    }
    if (query.maxPrice != null && query.maxPrice >= 0) {
      conditions.push(lte(product.priceCents, Math.round(query.maxPrice * 100)));
    }
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const sortOption = query.sort ?? 'newest';
    const orderByClause =
      sortOption === 'price-asc'
        ? asc(product.priceCents)
        : sortOption === 'price-desc'
          ? desc(product.priceCents)
          : sortOption === 'name-asc'
            ? asc(product.name)
            : sortOption === 'name-desc'
              ? desc(product.name)
              : desc(product.createdAt);

    const [data, countResult] = await Promise.all([
      this.db
        .select()
        .from(product)
        .where(whereClause)
        .orderBy(orderByClause)
        .limit(limit)
        .offset(offset),
      this.db
        .select({ count: sql<number>`count(*)::int` })
        .from(product)
        .where(whereClause),
    ]);

    const total = countResult[0]?.count ?? 0;

    const images = await this.db.select().from(productImage);
    const categories = await this.db.select().from(category);
    const categoryMap = new Map(categories.map((c) => [c.id, c]));
    const imagesByProduct = new Map<string, ProductImage[]>();
    for (const img of images) {
      const list = imagesByProduct.get(img.productId) ?? [];
      list.push(img);
      imagesByProduct.set(img.productId, list);
    }

    const enriched = data.map((p) => ({
      ...p,
      images: imagesByProduct.get(p.id) ?? [],
      category: categoryMap.get(p.categoryId) ?? null,
    }));

    return {
      data: enriched,
      pagination: { page, limit, total },
    };
  }

  async getProductById(id: string): Promise<
    | (Product & {
        images: ProductImage[];
        category: Category | null;
      })
    | null
  > {
    const [p] = await this.db.select().from(product).where(eq(product.id, id));
    if (!p) return null;

    const [images, categories] = await Promise.all([
      this.db.select().from(productImage).where(eq(productImage.productId, id)),
      this.db.select().from(category).where(eq(category.id, p.categoryId)),
    ]);
    const cat = categories[0] ?? null;
    return {
      ...p,
      images,
      category: cat,
    };
  }

  /** Look up a product by its URL-safe slug (used for public-facing routes). */
  async getProductBySlug(slug: string): Promise<
    | (Product & {
        images: ProductImage[];
        category: Category | null;
      })
    | null
  > {
    const [p] = await this.db.select().from(product).where(eq(product.slug, slug));
    if (!p) return null;

    const [images, categories] = await Promise.all([
      this.db.select().from(productImage).where(eq(productImage.productId, p.id)),
      this.db.select().from(category).where(eq(category.id, p.categoryId)),
    ]);
    const cat = categories[0] ?? null;
    return {
      ...p,
      images,
      category: cat,
    };
  }

  async createProduct(dto: CreateProductDto): Promise<Product & { images: ProductImage[] }> {
    const id = randomUUID();
    const slug = generateSlug(dto.name);
    await this.db.insert(product).values({
      id,
      name: dto.name,
      slug,
      description: dto.description,
      priceCents: dto.priceCents,
      stockQuantity: dto.stockQuantity ?? 0,
      categoryId: dto.categoryId,
      brand: dto.brand,
      weightMetric: dto.weightMetric ?? null,
      weightImperial: dto.weightImperial ?? null,
      dimensionMetric: dto.dimensionMetric ?? null,
      dimensionImperial: dto.dimensionImperial ?? null,
    });

    const imageInputs = dto.images ?? [];
    for (let i = 0; i < imageInputs.length; i++) {
      await this.db.insert(productImage).values({
        id: randomUUID(),
        productId: id,
        imageUrl: imageInputs[i].url,
        altText: null,
        isPrimary: i === 0,
      });
    }

    const [created] = await this.db.select().from(product).where(eq(product.id, id));
    const images = await this.db.select().from(productImage).where(eq(productImage.productId, id));
    return { ...created, images };
  }

  async updateProduct(id: string, dto: UpdateProductDto): Promise<Product | null> {
    const [existing] = await this.db.select().from(product).where(eq(product.id, id));
    if (!existing) return null;

    const updateData: Partial<typeof product.$inferInsert> = {};
    if (dto.name != null) {
      updateData.name = dto.name;
      updateData.slug = generateSlug(dto.name);
    }
    if (dto.description != null) updateData.description = dto.description;
    if (dto.priceCents != null) updateData.priceCents = dto.priceCents;
    if (dto.stockQuantity != null) updateData.stockQuantity = dto.stockQuantity;
    if (dto.categoryId != null) updateData.categoryId = dto.categoryId;
    if (dto.brand != null) updateData.brand = dto.brand;
    if (dto.weightMetric != null) updateData.weightMetric = dto.weightMetric;
    if (dto.weightImperial != null) updateData.weightImperial = dto.weightImperial;
    if (dto.dimensionMetric != null) updateData.dimensionMetric = dto.dimensionMetric;
    if (dto.dimensionImperial != null) updateData.dimensionImperial = dto.dimensionImperial;

    if (Object.keys(updateData).length > 0) {
      await this.db.update(product).set(updateData).where(eq(product.id, id));
    }

    if (dto.images != null) {
      await this.db.delete(productImage).where(eq(productImage.productId, id));
      for (let i = 0; i < dto.images.length; i++) {
        await this.db.insert(productImage).values({
          id: randomUUID(),
          productId: id,
          imageUrl: dto.images[i].url,
          altText: null,
          isPrimary: i === 0,
        });
      }
    }

    const [updated] = await this.db.select().from(product).where(eq(product.id, id));
    return updated ?? null;
  }

  async deleteProduct(id: string): Promise<boolean> {
    const [existing] = await this.db.select().from(product).where(eq(product.id, id));
    if (!existing) return false;
    try {
      await this.db.delete(product).where(eq(product.id, id));
    } catch (err: unknown) {
      const dbErr = err as { cause?: { code?: string } };
      if (dbErr?.cause?.code === '23503' || dbErr?.cause?.code === '23001') {
        throw new ConflictException({
          success: false,
          error: {
            code: 'PRODUCT_IN_USE',
            message: 'This product cannot be deleted because it is part of existing orders. Consider keeping it and marking it out of stock instead.',
          },
        });
      }
      throw err;
    }
    return true;
  }

  async createCategory(name: string, slug: string, parentCategoryId?: string): Promise<Category> {
    const id = randomUUID();
    await this.db.insert(category).values({
      id,
      name,
      slug,
      parentCategoryId: parentCategoryId ?? null,
    });
    const [created] = await this.db.select().from(category).where(eq(category.id, id));
    if (!created) throw new Error('Failed to create category');
    return created;
  }
}
