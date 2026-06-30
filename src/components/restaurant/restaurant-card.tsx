import Image from "next/image";
import { Clock, MapPin, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import type { Restaurant } from "@/lib/types/restaurant";

type RestaurantCardProps = {
  restaurant: Restaurant;
  priority?: boolean;
};

export function RestaurantCard({ restaurant, priority = false }: RestaurantCardProps) {
  return (
    <article className="restaurant-card">
      <div className="relative aspect-[16/10] overflow-hidden">
        <Image
          src={restaurant.cover}
          alt={restaurant.name}
          fill
          priority={priority}
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
          className="object-cover"
        />
        <div className="image-scrim" />
        <span className="rating-pill">{restaurant.rating}</span>
      </div>

      <div className="grid gap-4 p-5">
        <div>
          <p className="text-xs font-semibold uppercase text-[color:var(--muted-foreground)]">{restaurant.cuisine}</p>
          <h3 className="mt-1 text-xl font-semibold text-[color:var(--foreground)]">{restaurant.name}</h3>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-[color:var(--muted-foreground)]">
            {restaurant.description}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge>
            <Clock aria-hidden="true" size={14} />
            {restaurant.eta}
          </Badge>
          <Badge>
            <Truck aria-hidden="true" size={14} />
            {restaurant.deliveryFee}
          </Badge>
          <Badge>
            <MapPin aria-hidden="true" size={14} />
            {restaurant.city}
          </Badge>
        </div>

        <LinkButton href={`/restorani/${restaurant.id}`} className="w-full">
          Pogledaj meni
        </LinkButton>
      </div>
    </article>
  );
}
