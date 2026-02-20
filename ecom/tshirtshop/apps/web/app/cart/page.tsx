import { cookies } from "next/headers";
import Link from "next/link";
import { getCartIdFromCookies } from "@/lib/cart-cookie";
import { fetchCart } from "@/lib/api/cart";
import { CartClient } from "./CartClient";

export const metadata = {
  title: "Cart | Darkloom",
  description: "Your shopping cart",
};

export default async function CartPage() {
  const cookieStore = await cookies();
  const cartId = getCartIdFromCookies(cookieStore);
  const cart = await fetchCart(cartId);

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
        <span className="text-white">Cart</span>
      </nav>

      <h1
        className="mb-8 text-2xl font-bold uppercase tracking-tight text-white sm:text-4xl"
        style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
      >
        Cart
      </h1>

      <CartClient initialCart={cart} />
    </div>
  );
}
