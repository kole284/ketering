import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { RestaurantCard } from "@/components/restaurant-card";
import { fill, localePath } from "@/i18n/config";
import { getDictionary } from "@/i18n/server";
import { bookingSearch, formatDate, parseBooking, serviceLabel, slotLabel } from "@/lib/booking";
import { availableRestaurants } from "@/lib/restaurants";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: `${t.restaurants.title} | Servingo` };
}

function SummaryItem({ label, value, empty }: { label: string; value?: string; empty: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-[13px] text-muted">{label}</dt>
      <dd className={`text-[15px] font-medium ${value ? "" : "text-muted"}`}>{value ?? empty}</dd>
    </div>
  );
}

async function Results({ searchParams }: Pick<PageProps<"/[lang]/restorani">, "searchParams">) {
  const { locale, t } = await getDictionary();
  const booking = parseBooking(await searchParams);
  await connection(); // lead times are checked against the current time
  const restaurants = availableRestaurants(booking);
  const search = bookingSearch(booking);
  const hasSlot = booking.date !== undefined && booking.hour !== undefined;
  const editHref = localePath(locale, `/?${search}`);

  return (
    <>
      <div className="flex flex-col gap-5 rounded-2xl bg-surface p-5 md:flex-row md:items-center md:justify-between">
        <dl className="grid grid-cols-2 gap-x-8 gap-y-4 md:flex">
          <SummaryItem
            label={t.restaurants.date}
            value={booking.date && formatDate(booking.date, locale)}
            empty={t.restaurants.notChosen}
          />
          <SummaryItem
            label={t.restaurants.time}
            value={booking.hour !== undefined ? slotLabel(booking.hour) : undefined}
            empty={t.restaurants.notChosen}
          />
          <SummaryItem
            label={t.restaurants.services}
            value={booking.services.length ? booking.services.map((id) => serviceLabel(id, t)).join(", ") : undefined}
            empty={t.restaurants.notChosen}
          />
        </dl>
        <Link
          href={editHref}
          className="flex h-11 items-center justify-center rounded-full border border-ink px-6 text-[15px] font-medium hover:bg-bg"
        >
          {hasSlot ? t.restaurants.edit : t.restaurants.chooseSlot}
        </Link>
      </div>

      {booking.query && <p className="mt-6 text-[15px]">{fill(t.restaurants.resultsFor, { q: booking.query })}</p>}

      {!hasSlot && <p className="mt-6 text-[15px] text-muted">{t.restaurants.slotHint}</p>}

      {restaurants.length > 0 ? (
        <ul className="mt-6 flex flex-col gap-4">
          {restaurants.map((restaurant) => (
            <li key={restaurant.id}>
              <RestaurantCard restaurant={restaurant} search={search} locale={locale} t={t} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-6 rounded-2xl border border-line px-6 py-12 text-center">
          <p className="text-xl font-medium">{t.restaurants.emptyTitle}</p>
          <p className="mx-auto mt-2 max-w-md text-[15px] text-muted">{t.restaurants.emptyText}</p>
          <Link
            href={editHref}
            className="mt-6 inline-flex h-12 items-center rounded-full bg-accent px-7 text-[15px] font-semibold text-on-accent hover:bg-accent-strong"
          >
            {t.restaurants.changeSlot}
          </Link>
        </div>
      )}
    </>
  );
}

export default async function RestaurantsPage({ searchParams }: PageProps<"/[lang]/restorani">) {
  const { t } = await getDictionary();
  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 py-8 md:px-6 md:py-12 xl:px-12">
      <h1 className="mb-6 text-[30px] font-medium tracking-[-0.015em] md:text-[40px]">{t.restaurants.title}</h1>
      <Suspense>
        <Results searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
