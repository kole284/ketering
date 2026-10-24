"use client";

import { plural } from "@/i18n/config";
import { useI18n } from "@/i18n/provider";
import { useCartDetails } from "@/lib/cart";

export function CartCount() {
  const { locale, t } = useI18n();
  const { count } = useCartDetails();
  if (count === 0) return null;
  return (
    <span className="absolute -top-0.5 left-5 flex size-[18px] items-center justify-center rounded-full bg-cta text-[11px] font-bold text-on-cta">
      <span aria-hidden="true">{count}</span>
      <span className="sr-only">{plural(locale, count, t.header.cartItems)}</span>
    </span>
  );
}
