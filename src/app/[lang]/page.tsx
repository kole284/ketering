import { Suspense } from "react";
import { connection } from "next/server";
import { BookingForm } from "@/components/booking-form";
import { belgradeTodayIso, parseBooking } from "@/lib/booking";

async function Booking({ searchParams }: Pick<PageProps<"/[lang]">, "searchParams">) {
  const booking = parseBooking(await searchParams);
  await connection(); // "today" must be computed per request

  return (
    <BookingForm
      todayIso={belgradeTodayIso()}
      defaultDate={booking.date}
      defaultHour={booking.hour}
      defaultServices={booking.services}
      defaultMethod={booking.method}
    />
  );
}

export default function Home({ searchParams }: PageProps<"/[lang]">) {
  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-1">
      <Suspense>
        <Booking searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
