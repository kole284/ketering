"use client";

import { useSyncExternalStore } from "react";
import type { Method } from "./booking";
import { DELIVERY_FEE, DELIVERY_MINIMUM, PLATFORM_FEE, SERVINGO_DRINKS, findItem, isDrink, type MenuItem } from "./menu";
import { RESTAURANTS } from "./restaurants";

/** `restaurantId` is the bill a line belongs to; drinks take the restaurant they were ordered with. */
export type CartLine = { itemId: string; quantity: number; restaurantId: string };
export type CartBooking = { date?: string; hour?: number; method?: Method };
type CartState = { lines: CartLine[]; booking: CartBooking };

export const lineKey = (line: Pick<CartLine, "itemId" | "restaurantId">) => `${line.restaurantId}:${line.itemId}`;

// Kept in localStorage until there is a backend.
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
    if (raw) state = { ...EMPTY, ...JSON.parse(raw) };
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

export function addToCart(item: MenuItem, quantity: number, restaurantId = item.restaurantId) {
  const key = lineKey({ itemId: item.id, restaurantId });
  const existing = state.lines.find((line) => lineKey(line) === key);
  const lines = existing
    ? state.lines.map((line) => (lineKey(line) === key ? { ...line, quantity: line.quantity + quantity } : line))
    : [...state.lines, { itemId: item.id, quantity, restaurantId }];
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

/** The bill for drinks ordered without a restaurant (straight from the drinks page). */
const SERVINGO_BILL = { id: SERVINGO_DRINKS, name: "Servingo" };

export function cartDetails(
  cart: CartState,
  // At checkout the chosen method and city decide delivery; elsewhere the homepage choice does.
  { method = cart.booking.method ?? "dostava", cityOk = true }: { method?: Method; cityOk?: boolean } = {},
) {
  const lines = cart.lines.flatMap((line) => {
    const item = findItem(line.itemId);
    // Lines saved before drinks moved to Servingo have no restaurantId.
    return item ? [{ ...line, restaurantId: line.restaurantId ?? item.restaurantId, key: lineKey(line), item, total: item.price * line.quantity }] : [];
  });

  // One restaurant, one bill: fees and the delivery minimum apply per restaurant.
  const sellers = [...RESTAURANTS.map((r) => ({ id: r.id, name: r.name })), SERVINGO_BILL];
  const bills = sellers.flatMap((seller) => {
    const own = lines.filter((line) => line.restaurantId === seller.id);
    if (own.length === 0) return [];
    const subtotal = own.reduce((sum, line) => sum + line.total, 0);
    const reachesMinimum = subtotal >= DELIVERY_MINIMUM;
    const delivery = method === "dostava" && cityOk && reachesMinimum;
    const deliveryFee = delivery ? DELIVERY_FEE : 0;
    return [
      {
        restaurant: seller,
        lines: own,
        subtotal,
        delivery,
        /** Why a bill is pickup: the customer chose it, the city is outside Belgrade, or it is under the minimum. */
        pickupReason: delivery ? null : method === "preuzimanje" ? "chosen" : !cityOk ? "city" : "minimum",
        deliveryFee,
        platformFee: PLATFORM_FEE,
        total: subtotal + deliveryFee + PLATFORM_FEE,
        missingForDelivery: Math.max(0, DELIVERY_MINIMUM - subtotal),
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

export type CartBill = ReturnType<typeof cartDetails>["bills"][number];
