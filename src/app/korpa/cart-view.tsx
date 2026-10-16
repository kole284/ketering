"use client";

import Link from "next/link";
import { OrderSummary } from "@/components/order-summary";
import { QuantityStepper } from "@/components/quantity-stepper";
import { cartDetails, setQuantity, useCart } from "@/lib/cart";
import { formatPrice, priceLabel } from "@/lib/menu";
import { RESTAURANTS } from "@/lib/restaurants";

export function CartView() {
  const cart = cartDetails(useCart());

  if (cart.count === 0) {
    return (
      <div className="mt-8">
        <p className="text-lg text-muted">Korpa je prazna. Izaberi termin i dodaj nešto iz ponude restorana.</p>
        <Link
          href="/"
          className="mt-6 inline-flex h-12 items-center rounded-full bg-accent px-7 text-[15px] font-semibold text-on-accent hover:bg-accent-strong"
        >
          Izaberi termin
        </Link>
      </div>
    );
  }

  const groups = RESTAURANTS.map((restaurant) => ({
    restaurant,
    lines: cart.lines.filter((line) => line.item.restaurantId === restaurant.id),
  })).filter((group) => group.lines.length > 0);

  return (
    <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_380px] lg:items-start">
      <div className="flex flex-col gap-10">
        {groups.map(({ restaurant, lines }) => (
          <section key={restaurant.id} aria-labelledby={`korpa-${restaurant.id}`}>
            <h2 id={`korpa-${restaurant.id}`} className="border-b border-ink pb-3 text-xl font-medium">
              {restaurant.name}
            </h2>
            <ul>
              {lines.map((line) => (
                <li
                  key={line.itemId}
                  className="flex flex-col gap-4 border-b border-line py-5 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="text-lg font-medium">{line.item.name}</p>
                    <p className="text-[15px] text-muted">{priceLabel(line.item)}</p>
                  </div>
                  <div className="flex items-center justify-between gap-6">
                    <QuantityStepper
                      item={line.item}
                      value={line.quantity}
                      onChange={(quantity) => setQuantity(line.itemId, quantity)}
                      allowZero
                    />
                    <p className="w-28 text-right text-[15px] font-medium tabular-nums">{formatPrice(line.total)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <div className="lg:sticky lg:top-28">
        <OrderSummary cart={cart}>
          <Link
            href="/placanje"
            className="flex h-14 items-center justify-center rounded-full bg-accent text-base font-semibold text-on-accent hover:bg-accent-strong"
          >
            Idi na plaćanje
          </Link>
        </OrderSummary>
      </div>
    </div>
  );
}
