"use client";

import { useSyncExternalStore } from "react";
import type { Method } from "./booking";
import { useConfig, type Config } from "./config";
import { SERVINGO_DRINKS, isDrink, type MenuItem } from "./menu";

/** Whose bill a line goes on: a restaurant, or Servingo for drinks ordered on their own. */
export type Seller = { id: string; name: string };

/** The bill for drinks ordered without a restaurant (straight from the drinks page). */
export const SERVINGO_SELLER: Seller = { id: SERVINGO_DRINKS, name: "Servingo" };

/**
 * `restaurantId` is the bill a line belongs to; drinks take the restaurant they were ordered with.
 * The item and restaurant name are copied in when added, so the cart renders without the catalog;
 * the server recalculates every price at checkout.
 */
export type CartLine = { itemId: string; quantity: number; restaurantId: string; restaurantName: string; item: MenuItem };
export type CartBooking = { date?: string; hour?: number; method?: Method };
type CartState = { lines: CartLine[]; booking: CartBooking };

export const lineKey = (line: Pick<CartLine, "itemId" | "restaurantId">) => `${line.restaurantId}:${line.itemId}`;

// Kept in localStorage; only the booking and lines live here, prices come from the server.
const KEY = "servingo-cart";
const EMPTY: CartState = { lines: [], booking: {} };

let state: CartState = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return;
    const saved = { ...EMPTY, ...JSON.parse(raw) } as CartState;
    // Carts saved before the database have no item copy; those lines are dropped.
    state = { ...saved, lines: saved.lines.filter((line) => line.item && line.restaurantName) };
  } catch {
    // Storage blocked or corrupt; start empty.
  }
}

function set(next: CartState) {
  state = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Ignore; the cart still works for this page view.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  load();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useCart() {
  return useSyncExternalStore(
    subscribe,
    () => {
      load();
      return state;
    },
    () => EMPTY,
  );
}

export function addToCart(item: MenuItem, quantity: number, seller: Seller) {
  const key = lineKey({ itemId: item.id, restaurantId: seller.id });
  const existing = state.lines.find((line) => lineKey(line) === key);
  const lines = existing
    ? state.lines.map((line) => (lineKey(line) === key ? { ...line, item, quantity: line.quantity + quantity } : line))
    : [...state.lines, { itemId: item.id, quantity, restaurantId: seller.id, restaurantName: seller.name, item }];
  set({ ...state, lines });
}

export function setQuantity(key: string, quantity: number) {
  set({
    ...state,
    lines:
      quantity <= 0
        ? state.lines.filter((line) => lineKey(line) !== key)
        : state.lines.map((line) => (lineKey(line) === key ? { ...line, quantity } : line)),
  });
}

export function setBooking(booking: CartBooking) {
  if (booking.date === undefined && booking.hour === undefined && booking.method === undefined) return;
  set({ ...state, booking: { ...state.booking, ...booking } });
}

export function clearCart() {
  set(EMPTY);
}

type DetailsOptions = { method?: Method; cityOk?: boolean };

export function cartDetails(
  cart: CartState,
  config: Pick<Config, "deliveryFee" | "platformFee" | "deliveryMinimum">,
  // At checkout the chosen method and city decide delivery; elsewhere the homepage choice does.
  { method = cart.booking.method ?? "dostava", cityOk = true }: DetailsOptions = {},
) {
  const lines = cart.lines.map((line) => ({ ...line, key: lineKey(line), total: line.item.price * line.quantity }));

  // One restaurant, one bill: fees and the delivery minimum apply per restaurant.
  // Bills follow the order restaurants were added in; Servingo's own drinks bill comes last.
  const sellers = new Map<string, Seller>();
  for (const line of lines) {
    if (line.restaurantId !== SERVINGO_DRINKS) sellers.set(line.restaurantId, { id: line.restaurantId, name: line.restaurantName });
  }
  sellers.set(SERVINGO_SELLER.id, SERVINGO_SELLER);

  const bills = [...sellers.values()].flatMap((seller) => {
    const own = lines.filter((line) => line.restaurantId === seller.id);
    if (own.length === 0) return [];
    const subtotal = own.reduce((sum, line) => sum + line.total, 0);
    const reachesMinimum = subtotal >= config.deliveryMinimum;
    const delivery = method === "dostava" && cityOk && reachesMinimum;
    const deliveryFee = delivery ? config.deliveryFee : 0;
    return [
      {
        restaurant: seller,
        lines: own,
        subtotal,
        delivery,
        /** Why a bill is pickup: the customer chose it, the city is outside Belgrade, or it is under the minimum. */
        pickupReason: delivery ? null : method === "preuzimanje" ? "chosen" : !cityOk ? "city" : "minimum",
        deliveryFee,
        platformFee: config.platformFee,
        total: subtotal + deliveryFee + config.platformFee,
        missingForDelivery: Math.max(0, config.deliveryMinimum - subtotal),
        // Servingo buys the drinks, so it must also get the order email for any bill with drinks.
        notifyServingo: own.some((line) => isDrink(line.item)),
      },
    ];
  });

  return {
    lines,
    bills,
    subtotal: lines.reduce((sum, line) => sum + line.total, 0),
    total: bills.reduce((sum, bill) => sum + bill.total, 0),
    needsAddress: bills.some((bill) => bill.delivery),
    count: lines.length,
  };
}

/** The cart worked out into bills with the current fees. */
export function useCartDetails(options?: DetailsOptions) {
  return cartDetails(useCart(), useConfig(), options);
}

export type CartDetails = ReturnType<typeof cartDetails>;
export type CartBill = CartDetails["bills"][number];
