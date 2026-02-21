import Link from "next/link";
import { ConfirmationClient } from "./ConfirmationClient";

export const metadata = {
  title: "Order Confirmation | Darkloom",
  description: "Your order has been placed",
};

export default async function CheckoutConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string; session_id?: string }>;
}) {
  const params = await searchParams;
  const orderId = params.orderId?.trim() ?? "";
  const sessionId = params.session_id?.trim() ?? null;

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-10 sm:px-6 sm:py-16">
      <nav className="mb-8 flex overflow-x-auto pb-1 text-[10px] uppercase tracking-widest text-white/60 sm:mb-12 sm:text-xs [scrollbar-width:none] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden">
        <Link href="/" className="hover:text-white">
          Home
        </Link>
        <span className="mx-2">/</span>
        <Link href="/shop" className="hover:text-white">
          Shop
        </Link>
        <span className="mx-2">/</span>
        <Link href="/cart" className="hover:text-white">
          Cart
        </Link>
        <span className="mx-2">/</span>
        <span className="text-white">Order Confirmation</span>
      </nav>

      {orderId ? (
        <ConfirmationClient orderId={orderId} sessionId={sessionId} />
      ) : (
        <div className="rounded-lg border border-white/10 bg-white/5 p-8 text-center">
          <p className="mb-6 text-white/80">No order specified.</p>
          <Link
            href="/checkout"
            className="inline-flex min-h-[44px] items-center justify-center rounded-md bg-[#FF4D00] px-6 py-2 text-sm font-medium uppercase tracking-wider text-white"
          >
            Back to checkout
          </Link>
        </div>
      )}
    </div>
  );
}
