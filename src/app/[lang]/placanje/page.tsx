import type { Metadata } from "next";
import { getDictionary } from "@/i18n/server";
import { CheckoutForm } from "./checkout-form";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: `${t.checkout.title} | Servingo` };
}

export default async function CheckoutPage() {
  const { t } = await getDictionary();
  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 py-8 md:px-6 md:py-12 xl:px-12">
      <h1 className="caps-title text-xl leading-tight hyphens-auto [overflow-wrap:anywhere] md:text-[32px]">{t.checkout.title}</h1>
      <CheckoutForm />
    </div>
  );
}
