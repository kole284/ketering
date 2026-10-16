"use client";

import { useState, type FormEvent, type InputHTMLAttributes, type ReactNode } from "react";
import Link from "next/link";
import { OrderSummary } from "@/components/order-summary";
import { formatDate, slotLabel } from "@/lib/booking";
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
        <p className="text-2xl font-medium">Porudžbina je primljena</p>
        <p className="mt-2 text-lg text-muted">
          Ovo je test porudžbina. Plaćanje i potvrda mejlom biće dostupni kad povežemo backend.
        </p>
        <Link href="/" className="mt-6 inline-flex h-12 items-center rounded-full border border-ink px-7 text-[15px] font-medium">
          Nazad na početnu
        </Link>
      </div>
    );
  }

  if (cart.count === 0) {
    return (
      <div className="mt-8">
        <p className="text-lg text-muted">Korpa je prazna, pa nema šta da se plati.</p>
        <Link
          href="/"
          className="mt-6 inline-flex h-12 items-center rounded-full bg-accent px-7 text-[15px] font-semibold text-on-accent hover:bg-accent-strong"
        >
          Izaberi termin
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mt-8 grid gap-10 lg:grid-cols-[1fr_380px] lg:items-start">
      <div className="flex max-w-2xl flex-col gap-10">
        <Section title="Termin dostave">
          {date && hour !== undefined ? (
            <p className="text-lg">
              {formatDate(date)}, {slotLabel(hour)}
            </p>
          ) : (
            <p className="text-[15px] text-muted">
              Termin nije izabran.{" "}
              <Link href="/" className="font-medium text-ink underline underline-offset-4">
                Izaberi datum i vreme
              </Link>
            </p>
          )}
        </Section>

        <Section title="Podaci za dostavu">
          <Field label="Ime i prezime" name="ime" autoComplete="name" required />
          <Field label="Adresa dostave" name="adresa" autoComplete="street-address" required />
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Email adresa" name="email" type="email" autoComplete="email" required />
            <Field label="Broj telefona" name="telefon" type="tel" autoComplete="tel" required />
          </div>
        </Section>

        <Section title="Kupac">
          <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Kupac">
            {(
              [
                ["fizicko", "Fizičko lice"],
                ["pravno", "Pravno lice"],
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
              <Field label="Naziv firme" name="firma" autoComplete="organization" required />
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="PIB" name="pib" inputMode="numeric" pattern="\d{9}" title="PIB ima 9 cifara" required />
                <Field label="Matični broj" name="mb" inputMode="numeric" pattern="\d{8}" title="Matični broj ima 8 cifara" required />
              </div>
            </div>
          )}
        </Section>

        <Section title="Plaćanje">
          <p className="text-[15px]">
            Plaćanje karticom. Posle potvrde otvara se sigurna stranica banke za unos podataka sa kartice.
          </p>
        </Section>
      </div>

      <div className="lg:sticky lg:top-28">
        <OrderSummary cart={cart}>
          <button
            type="submit"
            className="h-14 rounded-full bg-accent text-base font-semibold text-on-accent hover:bg-accent-strong"
          >
            Plati {formatPrice(cart.total)}
          </button>
          <Link href="/korpa" className="text-center text-[15px] font-medium underline underline-offset-4">
            Izmeni korpu
          </Link>
        </OrderSummary>
      </div>
    </form>
  );
}
