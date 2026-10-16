import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CartBar } from "@/components/cart-bar";
import { StarIcon } from "@/components/icons";
import { MenuList } from "@/components/menu-list";
import { INTL_LOCALE, plural } from "@/i18n/config";
import { getDictionary } from "@/i18n/server";
import { menuFor } from "@/lib/menu";
import { RESTAURANTS, findRestaurant, leadTimeLabel } from "@/lib/restaurants";

export function generateStaticParams() {
  return RESTAURANTS.map((restaurant) => ({ id: restaurant.id }));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/restorani/[id]">): Promise<Metadata> {
  const restaurant = findRestaurant((await params).id);
  return { title: restaurant ? `${restaurant.name} | Servingo` : "Servingo" };
}

async function Restaurant({ params }: Pick<PageProps<"/[lang]/restorani/[id]">, "params">) {
  const { locale, t } = await getDictionary();
  const restaurant = findRestaurant((await params).id);
  if (!restaurant) notFound();

  return (
    <>
      <div className="mx-auto w-full max-w-[1440px] px-4 pt-8 md:px-6 md:pt-12 xl:px-12">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-[30px] font-medium tracking-[-0.015em] md:text-[40px]">{restaurant.name}</h1>
            <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[15px]">
              <span className="flex items-center gap-1.5">
                <StarIcon size={18} className="text-accent" />
                <span className="font-medium">
                  {new Intl.NumberFormat(INTL_LOCALE[locale], { minimumFractionDigits: 1 }).format(restaurant.rating)}
                </span>
                <span className="text-muted">({plural(locale, restaurant.ratingCount, t.restaurants.ratings)})</span>
              </span>
              <span className="text-muted">{restaurant.area}</span>
            </p>
          </div>
          <p className="text-[15px]">{leadTimeLabel(restaurant.leadTimeHours, locale, t)}</p>
        </div>

        <div className="mt-10">
          <Suspense>
            <MenuList items={menuFor(restaurant.id)} />
          </Suspense>
        </div>
      </div>
      <CartBar />
    </>
  );
}

export default function RestaurantPage({ params }: PageProps<"/[lang]/restorani/[id]">) {
  return (
    <Suspense>
      <Restaurant params={params} />
    </Suspense>
  );
}
