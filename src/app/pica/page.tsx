import { Suspense } from "react";
import type { Metadata } from "next";
import { CartBar } from "@/components/cart-bar";
import { MenuList } from "@/components/menu-list";
import { DRINKS } from "@/lib/menu";

export const metadata: Metadata = { title: "Ponuda pića | Servingo" };

export default function DrinksPage() {
  return (
    <>
      <div className="mx-auto w-full max-w-[1440px] px-4 pt-8 md:px-6 md:pt-12 xl:px-12">
        <h1 className="text-[30px] font-medium tracking-[-0.015em] md:text-[40px]">Ponuda pića</h1>
        <p className="mt-3 max-w-[60ch] text-lg text-muted">
          Pića se poručuju u pakovanjima. Dostavljamo ih zajedno sa ostatkom porudžbine.
        </p>
        <div className="mt-10">
          <Suspense>
            <MenuList items={DRINKS} groupBy="restaurant" />
          </Suspense>
        </div>
      </div>
      <CartBar offerDrinks={false} nextLabel="Nastavi na korpu" />
    </>
  );
}
