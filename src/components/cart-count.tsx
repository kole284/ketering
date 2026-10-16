"use client";

import { cartDetails, useCart } from "@/lib/cart";

export function CartCount() {
  const { count } = cartDetails(useCart());
  if (count === 0) return null;
  return (
    <span className="absolute -top-0.5 left-5 flex size-[18px] items-center justify-center rounded-full bg-accent text-[11px] font-semibold text-on-accent">
      {count}
      <span className="sr-only"> stavki u korpi</span>
    </span>
  );
}
