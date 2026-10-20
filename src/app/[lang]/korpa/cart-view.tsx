"use client";

import Link from "next/link";
import { BillSummary, PaymentSummary } from "@/components/order-summary";
import { QuantityStepper } from "@/components/quantity-stepper";
import { useI18n } from "@/i18n/provider";
import { cartDetails, setQuantity, useCart } from "@/lib/cart";
import { formatPrice, priceLabel } from "@/lib/menu";

export function CartView() {
  const { locale, t, href } = useI18n();
  const cart = cartDetails(useCart());

  if (cart.count === 0) {
    return (
      <div className="mt-8">
        <p className="text-lg text-muted">{t.cart.empty}</p>
        <Link
          href={href("/")}
          className="mt-6 inline-flex h-12 items-center caps-cta bg-cta px-7 text-on-cta hover:bg-cta-strong"
        >
          {t.cart.chooseSlot}
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_380px] lg:items-start">
      <div className="flex min-w-0 flex-col gap-12">
        {/* One restaurant, one bill. */}
        {cart.bills.map((bill) => (
          <section key={bill.restaurant.id} aria-labelledby={`korpa-${bill.restaurant.id}`}>
            <h2 id={`korpa-${bill.restaurant.id}`} className="caps-title border-b border-ink pb-3 text-base">
              {bill.restaurant.name}
            </h2>
            <ul>
              {bill.lines.map((line) => (
                <li
                  key={line.key}
                  className="flex flex-col gap-4 border-b border-line py-5 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="text-lg font-medium">{line.item.name}</p>
                    <p className="text-[15px] text-muted">{priceLabel(line.item, locale, t)}</p>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <QuantityStepper
                      item={line.item}
                      value={line.quantity}
                      onChange={(quantity) => setQuantity(line.key, quantity)}
                      allowZero
                    />
                    <p className="text-right text-[15px] font-medium tabular-nums md:w-28">
                      {formatPrice(line.total, locale, t)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-5 md:ml-auto md:max-w-sm">
              <BillSummary bill={bill} />
            </div>
          </section>
        ))}
      </div>

      <div className="lg:sticky lg:top-[calc(var(--header-h)+24px)]">
        <PaymentSummary cart={cart}>
          <Link
            href={href("/placanje")}
            className="flex h-14 items-center justify-center caps-cta bg-cta text-on-cta hover:bg-cta-strong"
          >
            {t.cart.goToPayment}
          </Link>
        </PaymentSummary>
      </div>
    </div>
  );
}
