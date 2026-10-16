"use client";

import type { ReactNode } from "react";
import { cartDetails } from "@/lib/cart";
import { DELIVERY_FEE, PLATFORM_FEE, formatPrice } from "@/lib/menu";

export function OrderSummary({
  cart,
  children,
}: {
  cart: ReturnType<typeof cartDetails>;
  children?: ReactNode;
}) {
  const rows = [
    ["Jela i pića", cart.subtotal],
    ["Dostava", DELIVERY_FEE],
    ["Usluga platforme", PLATFORM_FEE],
  ] as const;

  return (
    <div className="flex flex-col gap-5 rounded-2xl bg-surface p-5 md:p-6">
      <dl className="flex flex-col gap-2 text-[15px]">
        {rows.map(([label, amount]) => (
          <div key={label} className="flex justify-between">
            <dt className="text-muted">{label}</dt>
            <dd className="tabular-nums">{formatPrice(amount)}</dd>
          </div>
        ))}
        <div className="mt-2 flex justify-between border-t border-ink pt-4 text-lg font-medium">
          <dt>Ukupna cena</dt>
          <dd className="tabular-nums">{formatPrice(cart.total)}</dd>
        </div>
      </dl>
      {children}
    </div>
  );
}
