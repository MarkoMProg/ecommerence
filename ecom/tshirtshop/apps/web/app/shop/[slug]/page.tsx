import Link from "next/link";
import type { Metadata } from "next";
import { fetchProduct, fetchProducts } from "@/lib/api/catalog";
import ProductDetailClient from "./ProductDetailClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await fetchProduct(slug);
  if (!product) return { title: "Product Not Found | Darkloom" };
  const title =
    product.name.length > 40
      ? `${product.name.slice(0, 37)}… | Darkloom`
      : `${product.name} | Darkloom`;
  return {
    title,
    description: product.description?.slice(0, 155) ?? `Shop ${product.name} at Darkloom.`,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await fetchProduct(slug);

  if (!product) {
    return (
      <div className="mx-auto max-w-[1400px] px-6 py-20 text-center">
        <p className="text-white/60">Product not found.</p>
        <Link href="/shop" className="mt-4 inline-block text-[#FF4D00]">
          Back to Shop
        </Link>
      </div>
    );
  }

  let relatedProducts: Awaited<ReturnType<typeof fetchProducts>>["products"] =
    [];
  try {
    const res = await fetchProducts({
      category: product.category,
      limit: 4,
    });
    relatedProducts = res.products
      .filter((p) => p.id !== product.id)
      .slice(0, 3);
  } catch (err) {
    console.error("[ProductPage] Related products fetch failed:", err);
  }

  return (
    <ProductDetailClient product={product} relatedProducts={relatedProducts} />
  );
}
