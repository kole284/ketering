"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { fill } from "@/i18n/config";
import { useI18n } from "@/i18n/provider";
import { parseBooking, serviceLabel, SERVICES } from "@/lib/booking";
import { addToCart, cartDetails, setBooking, useCart } from "@/lib/cart";
import { formatQuantity, priceLabel, type MenuItem } from "@/lib/menu";
import { RESTAURANTS } from "@/lib/restaurants";
import { QuantityStepper } from "./quantity-stepper";

function MenuRow({ item, inCart, onAdd }: { item: MenuItem; inCart?: number; onAdd: () => void }) {
  const { locale, t } = useI18n();
  const [quantity, setQuantity] = useState(item.min);
  const [added, setAdded] = useState(false);

  const add = () => {
    addToCart(item, quantity);
    onAdd();
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <li className="grid grid-cols-[88px_1fr] gap-x-4 gap-y-4 border-b border-ink py-6 md:grid-cols-[120px_1fr_auto] md:items-center md:gap-x-8">
      {/* Photo placeholder until restaurants upload real images. */}
      <div className="aspect-square rounded-xl bg-surface" role="img" aria-label={fill(t.restaurants.photo, { name: item.name })} />
      <div className="flex flex-col gap-1">
        <h3 className="text-lg font-medium md:text-xl">{item.name}</h3>
        <p className="text-[15px] text-muted">{item.description}</p>
        <p className="mt-1 text-[15px] font-medium">{priceLabel(item, locale, t)}</p>
        {inCart !== undefined && (
          <p className="text-sm text-muted">{fill(t.menu.inCart, { q: formatQuantity(item, inCart, locale, t) })}</p>
        )}
      </div>
      <div className="col-span-2 flex items-center gap-3 md:col-span-1">
        <QuantityStepper item={item} value={quantity} onChange={setQuantity} />
        <button
          type="button"
          onClick={add}
          className="h-12 flex-1 rounded-full bg-accent px-6 text-[15px] font-semibold whitespace-nowrap text-on-accent transition-colors hover:bg-accent-strong md:flex-none"
        >
          {added ? t.menu.added : t.menu.addToCart}
        </button>
      </div>
    </li>
  );
}

export function MenuList({
  items,
  groupBy = "service",
}: {
  items: MenuItem[];
  /** The drinks page groups by restaurant instead of by service. */
  groupBy?: "service" | "restaurant";
}) {
  const { t } = useI18n();
  const cart = useCart();
  const params = useSearchParams();
  const inCart = new Map(cartDetails(cart).lines.map((line) => [line.itemId, line.quantity]));

  // Remember the slot chosen on the homepage so checkout can show it.
  const rememberBooking = () => {
    const booking = parseBooking(Object.fromEntries(params));
    setBooking({ date: booking.date, hour: booking.hour });
  };

  const groups = (
    groupBy === "service"
      ? SERVICES.map((service) => ({
          key: service.id,
          title: serviceLabel(service.id, t),
          items: items.filter((item) => item.service === service.id),
        }))
      : RESTAURANTS.map((restaurant) => ({
          key: restaurant.id,
          title: restaurant.name,
          items: items.filter((item) => item.restaurantId === restaurant.id),
        }))
  ).filter((group) => group.items.length > 0);

  return (
    <div className="flex flex-col gap-12">
      {groups.map((group) => (
        <section key={group.key} aria-labelledby={`grupa-${group.key}`}>
          <h2 id={`grupa-${group.key}`} className="border-b border-ink pb-3 text-2xl font-medium tracking-[-0.01em]">
            {group.title}
          </h2>
          <ul>
            {group.items.map((item) => (
              <MenuRow key={item.id} item={item} inCart={inCart.get(item.id)} onAdd={rememberBooking} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
