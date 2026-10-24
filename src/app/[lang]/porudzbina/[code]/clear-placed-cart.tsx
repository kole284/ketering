"use client";

import { useEffect } from "react";
import { clearPlacedCart } from "@/lib/cart";

/** Empties the cart once the order made from it is paid; other carts are left alone. */
export function ClearPlacedCart({ code }: { code: string }) {
  useEffect(() => clearPlacedCart(code), [code]);
  return null;
}
