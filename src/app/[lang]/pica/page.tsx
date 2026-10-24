import { Suspense } from "react";
import type { Metadata } from "next";
import { CartBar } from "@/components/cart-bar";
import { MenuList } from "@/components/menu-list";
import { getDictionary } from "@/i18n/server";
import { getDrinks, getRestaurant } from "@/server/catalog";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: `${t.menu.drinksTitle} | Servingo` };
}

/** ?restoran= is set by the drinks prompt on a restaurant page; the drinks then join that restaurant's bill. */
async function Drinks({ searchParams }: Pick<PageProps<"/[lang]/pica">, "searchParams">) {
  const from = (await searchParams).restoran;
  const [items, restaurant] = await Promise.all([
    getDrinks(),
    typeof from === "string" ? getRestaurant(from) : undefined,
  ]);
  return <MenuList items={items} restaurant={restaurant && { id: restaurant.id, name: restaurant.name }} />;
}

export default async function DrinksPage({ searchParams }: PageProps<"/[lang]/pica">) {
  const { t } = await getDictionary();
  return (
    <>
      <div className="mx-auto w-full max-w-[1440px] px-4 pt-8 md:px-6 md:pt-12 xl:px-12">
        <h1 className="caps-title text-xl leading-tight hyphens-auto [overflow-wrap:anywhere] md:text-[32px]">{t.menu.drinksTitle}</h1>
        <p className="mt-3 max-w-[60ch] text-lg text-muted">{t.menu.drinksIntro}</p>
        <div className="mt-10">
          <Suspense>
            <Drinks searchParams={searchParams} />
          </Suspense>
        </div>
      </div>
      <CartBar />
    </>
  );
}
