"use client";

import type { ReactNode } from "react";
import { fill } from "@/i18n/config";
import { useI18n } from "@/i18n/provider";
import type { CartBill, cartDetails } from "@/lib/cart";
import { DELIVERY_MINIMUM, formatPrice } from "@/lib/menu";

/** One restaurant's bill: food, delivery or pickup, platform fee. */
export function BillSummary({ bill }: { bill: CartBill }) {
  const { locale, t } = useI18n();
  const price = (amount: number) => formatPrice(amount, locale, t);

  return (
    <div className="flex flex-col gap-3 bg-surface p-5">
      <dl className="flex flex-col gap-2 text-[15px]">
        <div className="flex justify-between gap-4">
          <dt className="text-muted">{t.cart.subtotal}</dt>
          <dd className="tabular-nums">{price(bill.subtotal)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted">{bill.delivery ? t.cart.delivery : t.cart.pickup}</dt>
          <dd className="tabular-nums">{price(bill.deliveryFee)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted">{t.cart.platform}</dt>
          <dd className="tabular-nums">{price(bill.platformFee)}</dd>
        </div>
        <div className="mt-1 flex justify-between gap-4 border-t border-ink pt-3 font-medium">
          <dt>{t.cart.billTotal}</dt>
          <dd className="tabular-nums">{price(bill.total)}</dd>
        </div>
      </dl>
      {!bill.delivery && (
        <p className="text-sm text-muted">
          {fill(t.cart.pickupNote, { min: price(DELIVERY_MINIMUM), missing: price(bill.missingForDelivery) })}
        </p>
      )}
    </div>
  );
}

/** Sidebar total: each restaurant's bill and the amount paid in one go. */
export function PaymentSummary({ cart, children }: { cart: ReturnType<typeof cartDetails>; children?: ReactNode }) {
  const { locale, t } = useI18n();
  const price = (amount: number) => formatPrice(amount, locale, t);

  return (
    <div className="flex flex-col gap-5 bg-surface p-5 md:p-6">
      <p className="caps-title text-sm">{t.cart.toPay}</p>
      <dl className="flex flex-col gap-2 text-[15px]">
        {cart.bills.map((bill) => (
          <div key={bill.restaurant.id} className="flex justify-between gap-4">
            <dt className="min-w-0 truncate text-muted">
              {bill.restaurant.name}
              <span className="sr-only"> ({bill.delivery ? t.cart.delivery : t.cart.pickup})</span>
            </dt>
            <dd className="tabular-nums">{price(bill.total)}</dd>
          </div>
        ))}
        <div className="mt-2 flex justify-between gap-4 border-t border-ink pt-4 text-lg font-medium">
          <dt>{t.cart.grandTotal}</dt>
          <dd className="tabular-nums">{price(cart.total)}</dd>
        </div>
      </dl>
      {cart.bills.length > 1 && <p className="text-sm text-muted">{t.cart.billsNote}</p>}
      {children}
    </div>
  );
}
