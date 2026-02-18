import Link from "next/link";
import { fetchProduct, fetchProducts } from "@/lib/api/catalog";
import ProductDetailClient from "./ProductDetailClient";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await fetchProduct(id);

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
