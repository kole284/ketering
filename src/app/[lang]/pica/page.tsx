import { Suspense } from "react";
import type { Metadata } from "next";
import { CartBar } from "@/components/cart-bar";
import { MenuList } from "@/components/menu-list";
import { getDictionary } from "@/i18n/server";
import { DRINKS } from "@/lib/menu";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: `${t.menu.drinksTitle} | Servingo` };
}

export default async function DrinksPage() {
  const { t } = await getDictionary();
  return (
    <>
      <div className="mx-auto w-full max-w-[1440px] px-4 pt-8 md:px-6 md:pt-12 xl:px-12">
        <h1 className="caps-title text-xl leading-tight hyphens-auto [overflow-wrap:anywhere] md:text-[32px]">{t.menu.drinksTitle}</h1>
        <p className="mt-3 max-w-[60ch] text-lg text-muted">{t.menu.drinksIntro}</p>
        <div className="mt-10">
          <Suspense>
            <MenuList items={DRINKS} groupBy="restaurant" />
          </Suspense>
        </div>
      </div>
      <CartBar offerDrinks={false} />
    </>
  );
}
