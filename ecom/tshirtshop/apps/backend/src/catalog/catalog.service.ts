import { Injectable, Inject } from '@nestjs/common';
import { eq, desc, sql, and, type SQL } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { randomUUID } from 'crypto';
import { DATABASE_CONNECTION } from '../database/database-connection';
import { category, product, productImage } from './schema';

type Category = typeof category.$inferSelect;
type Product = typeof product.$inferSelect;
type ProductImage = typeof productImage.$inferSelect;

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
  imageUrls?: string[];
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
}

export interface ListProductsQuery {
  page?: number;
  limit?: number;
  category?: string;
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
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, countResult] = await Promise.all([
      this.db
        .select()
        .from(product)
        .where(whereClause)
        .orderBy(desc(product.createdAt))
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
    | (Product & { images: ProductImage[]; category: Category | null })
    | null
  > {
    const [p] = await this.db.select().from(product).where(eq(product.id, id));
    if (!p) return null;

    const [images, categories] = await Promise.all([
      this.db.select().from(productImage).where(eq(productImage.productId, id)),
      this.db.select().from(category).where(eq(category.id, p.categoryId)),
    ]);
    const cat = categories[0] ?? null;
    return { ...p, images, category: cat };
  }

  async createProduct(dto: CreateProductDto): Promise<Product & { images: ProductImage[] }> {
    const id = randomUUID();
    await this.db.insert(product).values({
      id,
      name: dto.name,
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

    const imageUrls = dto.imageUrls ?? [];
    for (let i = 0; i < imageUrls.length; i++) {
      await this.db.insert(productImage).values({
        id: randomUUID(),
        productId: id,
        imageUrl: imageUrls[i],
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
    if (dto.name != null) updateData.name = dto.name;
    if (dto.description != null) updateData.description = dto.description;
    if (dto.priceCents != null) updateData.priceCents = dto.priceCents;
    if (dto.stockQuantity != null) updateData.stockQuantity = dto.stockQuantity;
    if (dto.categoryId != null) updateData.categoryId = dto.categoryId;
    if (dto.brand != null) updateData.brand = dto.brand;
    if (dto.weightMetric != null) updateData.weightMetric = dto.weightMetric;
    if (dto.weightImperial != null) updateData.weightImperial = dto.weightImperial;
    if (dto.dimensionMetric != null) updateData.dimensionMetric = dto.dimensionMetric;
    if (dto.dimensionImperial != null) updateData.dimensionImperial = dto.dimensionImperial;

    await this.db.update(product).set(updateData).where(eq(product.id, id));
    const [updated] = await this.db.select().from(product).where(eq(product.id, id));
    return updated ?? null;
  }

  async deleteProduct(id: string): Promise<boolean> {
    const [existing] = await this.db.select().from(product).where(eq(product.id, id));
    if (!existing) return false;
    await this.db.delete(product).where(eq(product.id, id));
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
