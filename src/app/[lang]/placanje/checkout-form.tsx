"use client";

import { useState, type FormEvent, type InputHTMLAttributes, type ReactNode } from "react";
import Link from "next/link";
import { OrderSummary } from "@/components/order-summary";
import { formatDate, slotLabel } from "@/lib/booking";
import { fill } from "@/i18n/config";
import { useI18n } from "@/i18n/provider";
import { cartDetails, clearCart, useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/menu";

function Field({ label, ...props }: { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-[15px] font-medium">
        {label}
        {props.required && <span className="text-accent" aria-hidden="true"> *</span>}
      </span>
      <input
        className="h-14 rounded-2xl border border-line px-5 text-base placeholder:text-muted focus:border-ink focus:outline-none"
        {...props}
      />
    </label>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-5 border-t border-ink pt-6">
      <h2 className="text-xl font-medium">{title}</h2>
      {children}
    </section>
  );
}

export function CheckoutForm() {
  const { locale, t, href } = useI18n();
  const raw = useCart();
  const cart = cartDetails(raw);
  const { date, hour } = raw.booking;
  const [buyer, setBuyer] = useState<"fizicko" | "pravno">("fizicko");
  const [placed, setPlaced] = useState(false);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    // No backend or payment provider yet: this only simulates a placed order.
    clearCart();
    setPlaced(true);
  };

  if (placed) {
    return (
      <div className="mt-8 max-w-xl">
        <p className="text-2xl font-medium">{t.checkout.placedTitle}</p>
        <p className="mt-2 text-lg text-muted">
          {t.checkout.placedText}
        </p>
        <Link href={href("/")} className="mt-6 inline-flex h-12 items-center rounded-full border border-ink px-7 text-[15px] font-medium">
          {t.checkout.home}
        </Link>
      </div>
    );
  }

  if (cart.count === 0) {
    return (
      <div className="mt-8">
        <p className="text-lg text-muted">{t.checkout.empty}</p>
        <Link
          href={href("/")}
          className="mt-6 inline-flex h-12 items-center rounded-full bg-accent px-7 text-[15px] font-semibold text-on-accent hover:bg-accent-strong"
        >
          {t.cart.chooseSlot}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mt-8 grid gap-10 lg:grid-cols-[1fr_380px] lg:items-start">
      <div className="flex max-w-2xl flex-col gap-10">
        <Section title={t.checkout.slot}>
          {date && hour !== undefined ? (
            <p className="text-lg">
              {formatDate(date, locale)}, {slotLabel(hour)}
            </p>
          ) : (
            <p className="text-[15px] text-muted">
              {t.checkout.noSlot}{" "}
              <Link href={href("/")} className="font-medium text-ink underline underline-offset-4">
                {t.checkout.pickSlot}
              </Link>
            </p>
          )}
        </Section>

        <Section title={t.checkout.delivery}>
          <Field label={t.checkout.name} name="ime" autoComplete="name" required />
          <Field label={t.checkout.address} name="adresa" autoComplete="street-address" required />
          <div className="grid gap-5 md:grid-cols-2">
            <Field label={t.checkout.email} name="email" type="email" autoComplete="email" required />
            <Field label={t.checkout.phone} name="telefon" type="tel" autoComplete="tel" required />
          </div>
        </Section>

        <Section title={t.checkout.buyer}>
          <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label={t.checkout.buyer}>
            {(
              [
                ["fizicko", t.checkout.person],
                ["pravno", t.checkout.company],
              ] as const
            ).map(([value, label]) => (
              <label
                key={value}
                className={`flex h-14 cursor-pointer items-center gap-3 rounded-2xl border px-5 has-focus-visible:outline-2 has-focus-visible:outline-ink ${
                  buyer === value ? "border-accent bg-accent-soft" : "border-line hover:border-ink"
                }`}
              >
                <input
                  type="radio"
                  name="kupac"
                  value={value}
                  checked={buyer === value}
                  onChange={() => setBuyer(value)}
                  className="sr-only"
                />
                <span
                  className={`flex size-5 items-center justify-center rounded-full border ${
                    buyer === value ? "border-accent" : "border-muted"
                  }`}
                >
                  {buyer === value && <span className="size-2.5 rounded-full bg-accent" />}
                </span>
                <span className="text-base font-medium">{label}</span>
              </label>
            ))}
          </div>
          {buyer === "pravno" && (
            <div className="flex flex-col gap-5">
              <Field label={t.checkout.companyName} name="firma" autoComplete="organization" required />
              <div className="grid gap-5 md:grid-cols-2">
                <Field label={t.checkout.pib} name="pib" inputMode="numeric" pattern="\d{9}" title={t.checkout.pibHint} required />
                <Field label={t.checkout.mb} name="mb" inputMode="numeric" pattern="\d{8}" title={t.checkout.mbHint} required />
              </div>
            </div>
          )}
        </Section>

        <Section title={t.checkout.payment}>
          <p className="text-[15px]">
            {t.checkout.paymentText}
          </p>
        </Section>
      </div>

      <div className="lg:sticky lg:top-28">
        <OrderSummary cart={cart}>
          <button
            type="submit"
            className="h-14 rounded-full bg-accent text-base font-semibold text-on-accent hover:bg-accent-strong"
          >
            {fill(t.checkout.pay, { amount: formatPrice(cart.total, locale, t) })}
          </button>
          <Link href={href("/korpa")} className="text-center text-[15px] font-medium underline underline-offset-4">
            {t.checkout.editCart}
          </Link>
        </OrderSummary>
      </div>
    </form>
  );
}
