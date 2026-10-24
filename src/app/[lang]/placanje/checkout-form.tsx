"use client";

import { startTransition, useActionState, useEffect, useRef, useState, type FormEvent, type InputHTMLAttributes, type ReactNode } from "react";
import Link from "next/link";
import { PaymentSummary } from "@/components/order-summary";
import { formatDate, slotLabel, type Method } from "@/lib/booking";
import { fill } from "@/i18n/config";
import { useI18n } from "@/i18n/provider";
import { cartDetails, markPlaced, setBooking, updateItems, useCart } from "@/lib/cart";
import { useConfig } from "@/lib/config";
import { formatPrice } from "@/lib/menu";
import { ChevronDownIcon } from "@/components/icons";
import type { Dictionary } from "@/i18n/dictionaries/sr";
import type { Locale } from "@/i18n/config";
import type { OrderError } from "@/server/orders";
import { placeOrder } from "./actions";

function Field({ label, ...props }: { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-[15px] font-medium">
        {label}
        {props.required && <span className="text-accent" aria-hidden="true"> *</span>}
      </span>
      <input
        className="h-14 border border-line px-5 text-base placeholder:text-muted focus:border-ink focus:outline-none"
        {...props}
      />
    </label>
  );
}

/** Two or more bordered radio cards; the chosen one is outlined in orange. */
function RadioCards<T extends string>({
  name,
  label,
  value,
  options,
  onChange,
}: {
  name: string;
  label: string;
  value: T;
  options: { value: T; label: string; note?: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2" role="radiogroup" aria-label={label}>
      {options.map((option) => {
        const checked = value === option.value;
        return (
          <label
            key={option.value}
            className={`flex min-h-14 cursor-pointer items-center gap-3 border px-5 py-3 has-focus-visible:outline-2 has-focus-visible:outline-ink ${
              checked ? "border-cta bg-accent-soft" : "border-line hover:border-ink"
            }`}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={checked}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            <span
              className={`flex size-5 shrink-0 items-center justify-center rounded-full border ${checked ? "border-cta" : "border-muted"}`}
            >
              {checked && <span className="size-2.5 rounded-full bg-cta" />}
            </span>
            <span className="flex flex-col">
              <span className="text-base font-medium">{option.label}</span>
              {option.note && <span className="text-sm text-muted">{option.note}</span>}
            </span>
          </label>
        );
      })}
    </div>
  );
}

function errorText(error: OrderError, locale: Locale, t: Dictionary) {
  const messages = t.checkout.errors;
  switch (error.code) {
    case "item_unavailable":
      return error.name ? fill(messages.item_unavailable_named, { name: error.name }) : messages.item_unavailable;
    case "bad_quantity":
      return fill(messages.bad_quantity, { name: error.name });
    case "too_late":
      return fill(messages.too_late, { restaurant: error.restaurant });
    case "price_changed":
      return fill(messages.price_changed, { amount: formatPrice(error.total, locale, t) });
    default:
      return messages[error.code] ?? messages.generic;
  }
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-5 border-t border-ink pt-6">
      <h2 className="caps-title text-base">{title}</h2>
      {children}
    </section>
  );
}

export function CheckoutForm() {
  const { locale, t, href } = useI18n();
  const raw = useCart();
  const config = useConfig();
  const { date, hour } = raw.booking;
  // The homepage choice (step 04) is the default; changing it here updates the saved booking.
  const method: Method = raw.booking.method ?? "dostava";
  const [city, setCity] = useState("");
  const outsideArea = city === "drugo";
  const cart = cartDetails(raw, config, { method, cityOk: !outsideArea });
  const [buyer, setBuyer] = useState<"fizicko" | "pravno">("fizicko");
  // One key per checkout visit: sending the same cart and details twice reuses the order.
  const clientKey = useRef<string>(null);
  const [result, dispatch, pending] = useActionState(placeOrder, null);
  // The server's total wins once it has said the amount changed.
  const changed = result && !result.ok ? result.errors.find((error) => error.code === "price_changed") : undefined;
  const total = changed?.total ?? cart.total;

  useEffect(() => {
    if (!result) return;
    if (result.ok) {
      markPlaced(result.code);
      window.location.assign(result.redirectUrl);
      return;
    }
    if (result.catalog) updateItems(result.catalog);
  }, [result]);

  const submit = (e: FormEvent<HTMLFormElement>) => {
    // Dispatched by hand so a failed attempt keeps what the customer typed.
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    clientKey.current ??= crypto.randomUUID();
    form.set("kljuc", clientKey.current);
    startTransition(() => dispatch(form));
  };

  const errors = result && !result.ok ? [...new Set(result.errors.map((error) => errorText(error, locale, t)))] : [];

  if (cart.count === 0 && !result?.ok) {
    return (
      <div className="mt-8">
        <p className="text-lg text-muted">{t.checkout.empty}</p>
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
    <form onSubmit={submit} className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_380px] lg:items-start">
      <input type="hidden" name="korpa" value={JSON.stringify(raw.lines.map(({ itemId, restaurantId, quantity }) => ({ itemId, restaurantId, quantity })))} />
      <input type="hidden" name="datum" value={date ?? ""} />
      <input type="hidden" name="vreme" value={hour ?? ""} />
      <input type="hidden" name="iznos" value={total} />
      <input type="hidden" name="jezik" value={locale} />
      <div className="flex min-w-0 max-w-2xl flex-col gap-10">
        <Section title={method === "preuzimanje" ? t.checkout.slotPickup : t.checkout.slot}>
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

        <Section title={t.checkout.method}>
          <RadioCards<Method>
            name="nacin"
            label={t.checkout.method}
            value={method}
            onChange={(value) => setBooking({ method: value })}
            options={[
              { value: "dostava", label: t.booking.delivery, note: outsideArea ? t.checkout.unavailable : undefined },
              { value: "preuzimanje", label: t.booking.pickup },
            ]}
          />
          {method === "dostava" && (
            <label className="flex flex-col gap-2">
              <span className="text-[15px] font-medium">
                {t.checkout.city}
                <span className="text-accent" aria-hidden="true"> *</span>
              </span>
              <span className="relative">
                <select
                  name="grad"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className={`h-14 w-full appearance-none border border-line bg-bg px-5 pr-12 text-base focus:border-ink focus:outline-none ${city ? "" : "text-muted"}`}
                >
                  <option value="" disabled>
                    {t.checkout.cityPlaceholder}
                  </option>
                  <optgroup label={t.checkout.cityGroup}>
                    {config.deliveryCities.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </optgroup>
                  <option value="drugo">{t.checkout.otherCity}</option>
                </select>
                <ChevronDownIcon size={18} className="pointer-events-none absolute top-1/2 right-5 -translate-y-1/2" />
              </span>
            </label>
          )}
          {method === "dostava" && outsideArea && (
            <p role="alert" className="border-l-2 border-cta bg-accent-soft px-4 py-3 text-[15px]">
              {t.checkout.cityWarning}
            </p>
          )}
        </Section>

        <Section title={t.checkout.delivery}>
          <Field label={t.checkout.name} name="ime" autoComplete="name" required />
          {cart.needsAddress ? (
            <Field label={t.checkout.address} name="adresa" autoComplete="street-address" required />
          ) : (
            !outsideArea && <p className="text-[15px] text-muted">{t.checkout.pickupOnly}</p>
          )}
          {cart.needsAddress && cart.bills.some((bill) => !bill.delivery) && (
            <p className="text-sm text-muted">
              {t.cart.pickup}:{" "}
              {cart.bills
                .filter((bill) => !bill.delivery)
                .map((bill) => bill.restaurant.name)
                .join(", ")}
            </p>
          )}
          <div className="grid gap-5 md:grid-cols-2">
            <Field label={t.checkout.email} name="email" type="email" autoComplete="email" required />
            <Field label={t.checkout.phone} name="telefon" type="tel" autoComplete="tel" required />
          </div>
        </Section>

        <Section title={t.checkout.buyer}>
          <RadioCards<"fizicko" | "pravno">
            name="kupac"
            label={t.checkout.buyer}
            value={buyer}
            onChange={setBuyer}
            options={[
              { value: "fizicko", label: t.checkout.person },
              { value: "pravno", label: t.checkout.company },
            ]}
          />
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

      <div className="lg:sticky lg:top-[calc(var(--header-h)+24px)]">
        <PaymentSummary cart={cart}>
          {errors.length > 0 && (
            <div role="alert" className="border-l-2 border-cta bg-bg px-4 py-3 text-[15px]">
              <p className="font-medium">{t.checkout.errorsTitle}</p>
              <ul className="mt-1 flex flex-col gap-1">
                {errors.map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            </div>
          )}
          <button
            type="submit"
            disabled={pending || result?.ok}
            className="h-14 caps-cta bg-cta text-on-cta hover:bg-cta-strong disabled:bg-surface disabled:text-muted"
          >
            {pending || result?.ok ? t.checkout.paying : fill(t.checkout.pay, { amount: formatPrice(total, locale, t) })}
          </button>
          <Link href={href("/korpa")} className="text-center text-[15px] font-medium underline underline-offset-4">
            {t.checkout.editCart}
          </Link>
        </PaymentSummary>
      </div>
    </form>
  );
}
