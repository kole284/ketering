import type { Metadata } from "next";
import { getDictionary } from "@/i18n/server";
import { CartView } from "./cart-view";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: `${t.cart.title} | Servingo` };
}

export default async function CartPage() {
  const { t } = await getDictionary();
  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 py-8 md:px-6 md:py-12 xl:px-12">
      <h1 className="text-[30px] font-medium tracking-[-0.015em] md:text-[40px]">{t.cart.title}</h1>
      <CartView />
    </div>
  );
}
