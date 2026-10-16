import type { Metadata } from "next";
import { CheckoutForm } from "./checkout-form";

export const metadata: Metadata = { title: "Plaćanje | Servingo" };

export default function CheckoutPage() {
  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 py-8 md:px-6 md:py-12 xl:px-12">
      <h1 className="text-[30px] font-medium tracking-[-0.015em] md:text-[40px]">Plaćanje</h1>
      <CheckoutForm />
    </div>
  );
}
