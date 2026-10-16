import Link from "next/link";
import { serviceLabel } from "@/lib/booking";
import { leadTimeLabel, type Restaurant } from "@/lib/restaurants";
import { StarIcon } from "./icons";

export function RestaurantCard({ restaurant, search }: { restaurant: Restaurant; search: string }) {
  const href = `/restorani/${restaurant.id}${search ? `?${search}` : ""}`;

  return (
    <article className="flex flex-col gap-5 rounded-2xl border border-line p-4 md:flex-row md:items-center md:gap-8 md:p-5">
      {/* Photo placeholder until restaurants upload real images. */}
      <div
        className="aspect-[16/10] w-full shrink-0 rounded-xl bg-surface md:aspect-auto md:h-40 md:w-60"
        role="img"
        aria-label={`Fotografija: ${restaurant.name}`}
      />

      <div className="flex flex-1 flex-col gap-2">
        <h2 className="text-xl font-medium tracking-[-0.01em] md:text-2xl">{restaurant.name}</h2>
        <p className="flex items-center gap-1.5 text-[15px]">
          <StarIcon size={18} className="text-accent" />
          <span className="font-medium">{restaurant.rating.toFixed(1).replace(".", ",")}</span>
          <span className="text-muted">({restaurant.ratingCount} ocena)</span>
        </p>
        <p className="text-sm text-muted">
          {restaurant.area}, {restaurant.services.map(serviceLabel).join(", ")}
        </p>
        <p className="text-sm">Poruči najmanje {leadTimeLabel(restaurant.leadTimeHours)} unapred</p>
      </div>

      <Link
        href={href}
        className="flex h-12 shrink-0 items-center justify-center rounded-full bg-accent px-7 text-[15px] font-semibold text-on-accent transition-colors hover:bg-accent-strong"
      >
        Pogledaj ponudu
      </Link>
    </article>
  );
}
