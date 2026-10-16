"use client";

import type { ReactNode } from "react";
import { useI18n } from "@/i18n/provider";
import { cartDetails } from "@/lib/cart";
import { DELIVERY_FEE, PLATFORM_FEE, formatPrice } from "@/lib/menu";

export function OrderSummary({
  cart,
  children,
}: {
  cart: ReturnType<typeof cartDetails>;
  children?: ReactNode;
}) {
  const { locale, t } = useI18n();
  const rows = [
    [t.cart.subtotal, cart.subtotal],
    [t.cart.delivery, DELIVERY_FEE],
    [t.cart.platform, PLATFORM_FEE],
  ] as const;

  return (
    <div className="flex flex-col gap-5 rounded-2xl bg-surface p-5 md:p-6">
      <dl className="flex flex-col gap-2 text-[15px]">
        {rows.map(([label, amount]) => (
          <div key={label} className="flex justify-between">
            <dt className="text-muted">{label}</dt>
            <dd className="tabular-nums">{formatPrice(amount, locale, t)}</dd>
          </div>
        ))}
        <div className="mt-2 flex justify-between border-t border-ink pt-4 text-lg font-medium">
          <dt>{t.cart.total}</dt>
          <dd className="tabular-nums">{formatPrice(cart.total, locale, t)}</dd>
        </div>
      </dl>
      {children}
    </div>
  );
}
