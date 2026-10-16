import type { Metadata } from "next";
import { CartView } from "./cart-view";

export const metadata: Metadata = { title: "Korpa | Servingo" };

export default function CartPage() {
  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 py-8 md:px-6 md:py-12 xl:px-12">
      <h1 className="text-[30px] font-medium tracking-[-0.015em] md:text-[40px]">Korpa</h1>
      <CartView />
    </div>
  );
}
