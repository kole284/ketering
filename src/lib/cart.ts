"use client";

import { useSyncExternalStore } from "react";
import { DELIVERY_FEE, PLATFORM_FEE, findItem, type MenuItem } from "./menu";

export type CartLine = { itemId: string; quantity: number };
export type CartBooking = { date?: string; hour?: number };
type CartState = { lines: CartLine[]; booking: CartBooking };

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

export function addToCart(item: MenuItem, quantity: number) {
  const existing = state.lines.find((line) => line.itemId === item.id);
  const lines = existing
    ? state.lines.map((line) =>
        line.itemId === item.id ? { ...line, quantity: line.quantity + quantity } : line,
      )
    : [...state.lines, { itemId: item.id, quantity }];
  set({ ...state, lines });
}

export function setQuantity(itemId: string, quantity: number) {
  set({
    ...state,
    lines:
      quantity <= 0
        ? state.lines.filter((line) => line.itemId !== itemId)
        : state.lines.map((line) => (line.itemId === itemId ? { ...line, quantity } : line)),
  });
}

export function setBooking(booking: CartBooking) {
  if (booking.date === undefined && booking.hour === undefined) return;
  set({ ...state, booking: { ...state.booking, ...booking } });
}

export function clearCart() {
  set(EMPTY);
}

export function cartDetails(cart: CartState) {
  const lines = cart.lines.flatMap((line) => {
    const item = findItem(line.itemId);
    return item ? [{ ...line, item, total: item.price * line.quantity }] : [];
  });
  const subtotal = lines.reduce((sum, line) => sum + line.total, 0);
  const fees = lines.length > 0 ? DELIVERY_FEE + PLATFORM_FEE : 0;
  return {
    lines,
    subtotal,
    total: subtotal + fees,
    hasDrinks: lines.some((line) => line.item.service === "pica"),
    count: lines.length,
  };
}
