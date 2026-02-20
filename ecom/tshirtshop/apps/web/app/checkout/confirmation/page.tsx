import Link from "next/link";
import { fetchOrder } from "@/lib/api/orders";
import { CancelOrderButton } from "./CancelOrderButton";

export const metadata = {
  title: "Order Confirmation | Darkloom",
  description: "Your order has been placed",
};

export default async function CheckoutConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  const params = await searchParams;
  const orderId = params.orderId?.trim();
  const order = orderId ? await fetchOrder(orderId) : null;

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

      <div className="space-y-8">
        <div className="rounded-lg border border-white/10 bg-white/5 p-8 text-center sm:p-12">
          <h1
            className="mb-4 text-2xl font-bold uppercase tracking-tight text-white sm:text-4xl"
            style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
          >
            Order Confirmed
          </h1>
          <p className="mb-6 text-white/80">
            Thank you for your order. Your order has been created and is pending payment.
          </p>
          {orderId && (
            <p className="mb-6 font-mono text-sm text-white/60">
              Order ID: {orderId}
            </p>
          )}
          <p className="mb-8 text-sm text-white/60">
            Payment integration is in progress. You will receive an email when payment options are available.
          </p>
          {orderId && order && (
            <CancelOrderButton orderId={orderId} status={order.status} />
          )}
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/shop"
              className="inline-flex min-h-[44px] items-center justify-center rounded-md bg-[#FF4D00] px-6 py-2 text-sm font-medium uppercase tracking-wider text-white transition-colors hover:bg-[#FF4D00]/90"
            >
              Continue Shopping
            </Link>
            <Link
              href="/"
              className="inline-flex min-h-[44px] items-center justify-center rounded-md border border-white/20 px-6 py-2 text-sm font-medium uppercase tracking-wider text-white transition-colors hover:border-white/40"
            >
              Home
            </Link>
          </div>
        </div>

        {order && order.items.length > 0 && (
          <div className="rounded-lg border border-white/10 bg-white/5 p-6">
            {order.status === "cancelled" && (
              <p className="mb-6 rounded-md border border-amber-500/50 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                This order has been cancelled.
              </p>
            )}
            <h2 className="mb-6 text-sm font-medium uppercase tracking-wider text-white">
              Order details
            </h2>
            <ul className="mb-6 space-y-4 border-b border-white/10 pb-6">
              {order.items.map((item) => {
                const itemTotal = ((item.priceCentsAtOrder * item.quantity) / 100).toFixed(2);
                return (
                  <li key={item.id} className="flex gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white">
                        {item.productNameAtOrder}
                      </p>
                      <p className="text-xs text-white/60">
                        Qty {item.quantity} × ${(item.priceCentsAtOrder / 100).toFixed(2)}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-medium text-[#E6C068]">
                      ${itemTotal}
                    </p>
                  </li>
                );
              })}
            </ul>
            <div className="mb-4 space-y-2">
              <div className="flex justify-between text-sm text-white/80">
                <span>Subtotal</span>
                <span>${(order.subtotalCents / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-white/80">
                <span>Shipping</span>
                <span>${(order.shippingCents / 100).toFixed(2)}</span>
              </div>
            </div>
            <div className="flex justify-between border-t border-white/10 pt-4 text-lg font-medium text-white">
              <span>Total</span>
              <span className="text-[#E6C068]">
                ${(order.totalCents / 100).toFixed(2)}
              </span>
            </div>
            <div className="mt-6 border-t border-white/10 pt-6">
              <p className="mb-1 text-xs uppercase tracking-widest text-white/60">Ship to</p>
              <p className="text-sm text-white/80">
                {order.shippingFullName}
                <br />
                {order.shippingLine1}
                {order.shippingLine2 && (
                  <>
                    <br />
                    {order.shippingLine2}
                  </>
                )}
                <br />
                {order.shippingCity}, {order.shippingStateOrProvince} {order.shippingPostalCode}
                <br />
                {order.shippingCountry}
                {order.shippingPhone && (
                  <>
                    <br />
                    {order.shippingPhone}
                  </>
                )}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
