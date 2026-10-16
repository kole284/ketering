import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { RestaurantCard } from "@/components/restaurant-card";
import { bookingSearch, formatDate, parseBooking, serviceLabel, slotLabel } from "@/lib/booking";
import { availableRestaurants } from "@/lib/restaurants";

export const metadata: Metadata = { title: "Restorani | Servingo" };

function SummaryItem({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-[13px] text-muted">{label}</dt>
      <dd className={`text-[15px] font-medium ${value ? "" : "text-muted"}`}>{value ?? "Nije izabrano"}</dd>
    </div>
  );
}

async function Results({ searchParams }: Pick<PageProps<"/restorani">, "searchParams">) {
  const booking = parseBooking(await searchParams);
  await connection(); // lead times are checked against the current time
  const restaurants = availableRestaurants(booking);
  const search = bookingSearch(booking);
  const hasSlot = booking.date !== undefined && booking.hour !== undefined;

  return (
    <>
      <div className="flex flex-col gap-5 rounded-2xl bg-surface p-5 md:flex-row md:items-center md:justify-between">
        <dl className="grid grid-cols-2 gap-x-8 gap-y-4 md:flex">
          <SummaryItem label="Datum" value={booking.date && formatDate(booking.date)} />
          <SummaryItem
            label="Vreme dostave"
            value={booking.hour !== undefined ? slotLabel(booking.hour) : undefined}
          />
          <SummaryItem
            label="Usluge"
            value={booking.services.length ? booking.services.map(serviceLabel).join(", ") : undefined}
          />
        </dl>
        <Link
          href={`/?${search}`}
          className="flex h-11 items-center justify-center rounded-full border border-ink px-6 text-[15px] font-medium hover:bg-bg"
        >
          {hasSlot ? "Izmeni" : "Izaberi termin"}
        </Link>
      </div>

      {booking.query && (
        <p className="mt-6 text-[15px]">
          Rezultati za „{booking.query}“
        </p>
      )}

      {!hasSlot && (
        <p className="mt-6 text-[15px] text-muted">
          Izaberi datum i vreme da vidiš samo restorane koji stižu da pripreme porudžbinu.
        </p>
      )}

      {restaurants.length > 0 ? (
        <ul className="mt-6 flex flex-col gap-4">
          {restaurants.map((restaurant) => (
            <li key={restaurant.id}>
              <RestaurantCard restaurant={restaurant} search={search} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-6 rounded-2xl border border-line px-6 py-12 text-center">
          <p className="text-xl font-medium">Nijedan restoran ne stiže za ovaj termin</p>
          <p className="mx-auto mt-2 max-w-md text-[15px] text-muted">
            Restorani traže da se porudžbina napravi unapred. Izaberi kasniji datum ili drugu uslugu.
          </p>
          <Link
            href={`/?${search}`}
            className="mt-6 inline-flex h-12 items-center rounded-full bg-accent px-7 text-[15px] font-semibold text-on-accent hover:bg-accent-strong"
          >
            Promeni termin
          </Link>
        </div>
      )}
    </>
  );
}

export default function RestaurantsPage({ searchParams }: PageProps<"/restorani">) {
  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 py-8 md:px-6 md:py-12 xl:px-12">
      <h1 className="mb-6 text-[30px] font-medium tracking-[-0.015em] md:text-[40px]">Dostupni restorani</h1>
      <Suspense>
        <Results searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
