"use client";

import { plural } from "@/i18n/config";
import { useI18n } from "@/i18n/provider";
import { cartDetails, useCart } from "@/lib/cart";

export function CartCount() {
  const { locale, t } = useI18n();
  const { count } = cartDetails(useCart());
  if (count === 0) return null;
  return (
    <span className="absolute -top-0.5 left-5 flex size-[18px] items-center justify-center rounded-full bg-accent text-[11px] font-semibold text-on-accent">
      <span aria-hidden="true">{count}</span>
      <span className="sr-only">{plural(locale, count, t.header.cartItems)}</span>
    </span>
  );
}
