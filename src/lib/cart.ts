"use client";

import { useSyncExternalStore } from "react";
import type { Method } from "./booking";
import { useConfig } from "./config";
import type { MenuItem } from "./menu";
import { priceBills, type Fees, type Seller } from "./pricing";

export { SERVINGO_SELLER, type Seller } from "./pricing";

/**
 * `restaurantId` is the bill a line belongs to; drinks take the restaurant they were ordered with.
 * The item and restaurant name are copied in when added, so the cart renders without the catalog;
 * the server recalculates every price at checkout.
 */
export type CartLine = { itemId: string; quantity: number; restaurantId: string; restaurantName: string; item: MenuItem };
export type CartBooking = { date?: string; hour?: number; method?: Method };
/** `placedOrder` is the order sent to payment, so its status page can empty the cart once paid. */
type CartState = { lines: CartLine[]; booking: CartBooking; placedOrder?: string };

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

/** Remembers the order sent to payment; the cart stays in case the payment fails. */
export function markPlaced(code: string) {
  set({ ...state, placedOrder: code });
}

/** Empties the cart once the order made from it is paid. */
export function clearPlacedCart(code: string) {
  load();
  if (state.placedOrder === code) set(EMPTY);
}

/** Replaces the cart's item copies with fresh ones from the server, e.g. after a price change. */
export function updateItems(items: MenuItem[]) {
  const fresh = new Map(items.map((item) => [item.id, item]));
  set({ ...state, lines: state.lines.map((line) => ({ ...line, item: fresh.get(line.itemId) ?? line.item })) });
}

type DetailsOptions = { method?: Method; cityOk?: boolean };

export function cartDetails(
  cart: CartState,
  fees: Fees,
  // At checkout the chosen method and city decide delivery; elsewhere the homepage choice does.
  { method = cart.booking.method ?? "dostava", cityOk = true }: DetailsOptions = {},
) {
  return priceBills(cart.lines.map((line) => ({ ...line, key: lineKey(line) })), fees, { method, cityOk });
}

/** The cart worked out into bills with the current fees. */
export function useCartDetails(options?: DetailsOptions) {
  return cartDetails(useCart(), useConfig(), options);
}

export type CartDetails = ReturnType<typeof cartDetails>;
export type CartBill = CartDetails["bills"][number];
