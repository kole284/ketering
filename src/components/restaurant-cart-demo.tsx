"use client";

import Image from "next/image";
import { type FormEvent, useMemo, useState } from "react";
import { DatePicker } from "@/components/date-picker";
import { TimePicker } from "@/components/time-picker";
import type { Restaurant } from "@/lib/types/restaurant";
import { isOrderDateWithinBounds } from "@/lib/order-date";
import {
  formatWorkingHoursLabel,
  getRestaurantOrderTimeBounds,
  isTimeWithinRestaurantHours,
} from "@/lib/order-time";

type RestaurantCartDemoProps = {
  restaurant: Restaurant;
};

type CartState = Record<string, number>;

type CheckoutFormState = {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  eventAddress: string;
  eventDate: string;
  eventTime: string;
  note: string;
};

const initialCheckoutForm: CheckoutFormState = {
  customerName: "",
  customerEmail: "",
  customerPhone: "",
  eventAddress: "",
  eventDate: "",
  eventTime: "",
  note: "",
};

function parseRsdPrice(price: string): number {
  return Number(price.replace(/\./g, "").replace(" RSD", ""));
}

function formatRsd(value: number): string {
  return new Intl.NumberFormat("sr-RS").format(value) + " RSD";
}

export default function RestaurantCartDemo({ restaurant }: RestaurantCartDemoProps) {
  const [cart, setCart] = useState<CartState>({});
  const [checkoutForm, setCheckoutForm] = useState<CheckoutFormState>(initialCheckoutForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [fallbackSmsLink, setFallbackSmsLink] = useState<string | null>(null);

  const addToCart = (productName: string) => {
    setCart((prev) => ({
      ...prev,
      [productName]: (prev[productName] ?? 0) + 1,
    }));
  };

  const updateQuantity = (productName: string, delta: number) => {
    setCart((prev) => {
      const current = prev[productName] ?? 0;
      const next = Math.max(0, current + delta);

      if (next === 0) {
        const nextCart = { ...prev };
        delete nextCart[productName];
        return nextCart;
      }

      return {
        ...prev,
        [productName]: next,
      };
    });
  };

  const cartItems = useMemo(() => {
    return restaurant.products
      .filter((product) => (cart[product.name] ?? 0) > 0)
      .map((product) => ({
        ...product,
        quantity: cart[product.name],
        unitPrice: parseRsdPrice(product.price),
      }));
  }, [cart, restaurant.products]);

  const subtotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    [cartItems],
  );

  const deliveryFee = parseRsdPrice(restaurant.deliveryFee);
  const total = subtotal + (cartItems.length ? deliveryFee : 0);
  const totalCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const orderTimeBounds = getRestaurantOrderTimeBounds(restaurant);

  const canSubmitOrder =
    cartItems.length > 0 &&
    checkoutForm.customerName.trim().length >= 2 &&
    checkoutForm.customerEmail.includes("@") &&
    checkoutForm.customerPhone.trim().length >= 6 &&
    checkoutForm.eventAddress.trim().length >= 5 &&
    isOrderDateWithinBounds(checkoutForm.eventDate) &&
    isTimeWithinRestaurantHours(restaurant, checkoutForm.eventTime) &&
    !isSubmitting;

  const updateCheckoutField = <K extends keyof CheckoutFormState>(key: K, value: CheckoutFormState[K]) => {
    setCheckoutForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const clearCheckout = () => {
    setCart({});
    setCheckoutForm(initialCheckoutForm);
    setFallbackSmsLink(null);
  };

  const handleOrderSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!cartItems.length) {
      setSubmitError("Korpa je prazna. Dodaj stavke pre plaćanja.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);
    setFallbackSmsLink(null);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          restaurantId: restaurant.id,
          customerName: checkoutForm.customerName.trim(),
          customerEmail: checkoutForm.customerEmail.trim(),
          customerPhone: checkoutForm.customerPhone.trim(),
          eventAddress: checkoutForm.eventAddress.trim(),
          eventDate: checkoutForm.eventDate,
          eventTime: checkoutForm.eventTime,
          note: checkoutForm.note.trim() || undefined,
          sendSms: true,
          sendEmail: true,
          items: cartItems.map((item) => ({
            productId: item.id,
            quantity: item.quantity,
          })),
        }),
      });

      const data = (await response.json()) as {
        message?: string;
        id?: number;
        smsDelivery?: string;
        smsLink?: string;
        smsRecipient?: string;
        emailDelivery?: string;
        emailMessage?: string;
        customerPhone?: string;
        customerEmail?: string;
      };

      if (!response.ok) {
        throw new Error(data.message ?? "Naručivanje nije uspelo.");
      }

      if (data.smsDelivery === "composer" && data.smsLink) {
        clearCheckout();
        setFallbackSmsLink(data.smsLink);
        setSubmitSuccess(
          `Narudžbina #${data.id} je sačuvana. Email status: ${data.emailMessage ?? "nije poslat"}. Klikni na dugme ispod ako želiš ručno da otvoriš SMS poruku.`,
        );
        return;
      }

      clearCheckout();
      setSubmitSuccess(
        `Narudžbina #${data.id} je poslata. SMS potvrda je otišla na ${data.smsRecipient ?? "+381605581104"}. Email: ${data.emailMessage ?? "bez dodatne potvrde"}.`,
      );
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Naručivanje nije uspelo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="checkout" className="mt-8 grid items-start gap-6 overflow-x-hidden xl:grid-cols-[1.1fr_0.9fr]">
      <article className="selection-card reveal-up delay-1 min-w-0">
        <div>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <span className="eyebrow">Meni</span>
            <h2 className="mt-2 font-brand text-2xl font-semibold">Dodaj stavke u korpu</h2>
          </div>
          <span className="tag">
            {totalCount} stavki
          </span>
        </div>
        <p className="text-sm text-slate-600">
          Izaberi proizvode i količine. Finalni iznos se računa pre slanja porudžbine.
        </p>

        <div className="status-panel mt-4">
          <span className="status-dot" />
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-wide text-slate-500">Adresa</div>
              <div className="font-medium text-slate-800">{restaurant.address}</div>
            </div>
            <div className="text-right">
              <div className="text-xs font-bold uppercase tracking-wide text-slate-500">ETA</div>
              <div className="font-medium text-slate-800">{restaurant.eta}</div>
            </div>
          </div>
          <div className="mt-2 text-xs text-slate-500">{restaurant.offers && restaurant.offers.length ? restaurant.offers.join(" · ") : null}</div>
        </div>

        <div className="mt-5 space-y-3">
          {restaurant.products.map((product) => {
            const quantity = cart[product.name] ?? 0;

            return (
              <div
                key={product.name}
                className="flex min-w-0 flex-col gap-3 rounded-2xl bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Image
                    src={product.image}
                    alt={product.name}
                    width={64}
                    height={64}
                    className="h-16 w-16 rounded-xl object-cover"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">{product.name}</p>
                    <p className="text-xs text-slate-600">{product.price}</p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1.5 self-end sm:self-auto sm:gap-2">
                  <button
                    onClick={() => updateQuantity(product.name, -1)}
                    className="chip inline-flex h-8 w-8 items-center justify-center p-0 text-base leading-none sm:h-9 sm:w-9 sm:text-lg"
                    aria-label={`Smanji količinu za ${product.name}`}
                    disabled={quantity === 0}
                  >
                    -
                  </button>
                  <span className="w-6 text-center text-sm font-bold text-slate-800">{quantity}</span>
                  <button
                    onClick={() => addToCart(product.name)}
                    className="chip inline-flex h-8 w-8 items-center justify-center p-0 text-base leading-none sm:h-9 sm:w-9 sm:text-lg"
                    aria-label={`Povećaj količinu za ${product.name}`}
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 grid gap-4">
          <div className="surface-panel rounded-2xl p-4">
            <h3 className="mb-2 text-lg font-semibold">Preporučujemo</h3>
            <p className="mb-3 text-sm text-slate-600">Popularne stavke iz menija za brže sastavljanje porudžbine.</p>
            <div className="grid gap-2">
              {restaurant.products.slice(0, 3).map((p) => (
                <div key={p.id} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-2">
                  <Image src={p.image} alt={p.name} width={48} height={48} className="h-12 w-12 rounded-md object-cover" />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-slate-800">{p.name}</div>
                    <div className="text-xs text-slate-500">{p.price}</div>
                  </div>
                  <div className="ml-auto">
                    <button
                      onClick={() => addToCart(p.name)}
                      className="chip inline-flex h-8 items-center justify-center px-3"
                      aria-label={`Dodaj ${p.name}`}
                    >
                      Dodaj
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        </div>
      </article>

      <aside className="order-card reveal-up delay-2 min-w-0 xl:sticky xl:top-6 xl:self-start">
        <div>
        <span className="eyebrow">Checkout</span>
        <h2 className="mt-2 font-brand text-2xl font-semibold">Korpa i podaci za potvrdu</h2>
        <p className="mt-1 text-sm text-slate-600">Unesi podatke za isporuku i dobićeš pregled porudžbine.</p>

        {cartItems.length === 0 ? (
          <div className="mt-5 rounded-2xl bg-slate-50 p-5 text-sm text-slate-600">
            Korpa je trenutno prazna. Dodaj stavke iz menija da prikažeš pun tok porudžbine.
          </div>
        ) : (
          <div className="mt-5 max-h-64 space-y-3 overflow-y-auto pr-1 xl:max-h-72">
            {cartItems.map((item) => (
              <div key={item.name} className="rounded-2xl border border-slate-200 bg-white p-3">
                <div className="flex min-w-0 items-start justify-between gap-2">
                  <p className="min-w-0 truncate pr-2 text-sm font-semibold text-slate-800">{item.name}</p>
                  <p className="shrink-0 text-sm font-bold text-slate-900">
                    {formatRsd(item.unitPrice * item.quantity)}
                  </p>
                </div>
                <div className="mt-2 flex min-w-0 flex-wrap items-center justify-between gap-2">
                  <p className="truncate pr-2 text-xs text-slate-500">{item.price} po komadu</p>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.name, -1)}
                      className="chip inline-flex h-8 w-8 items-center justify-center p-0 text-base leading-none"
                      aria-label={`Umanji ${item.name}`}
                    >
                      -
                    </button>
                    <span className="w-5 text-center text-sm font-bold">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.name, 1)}
                      className="chip inline-flex h-8 w-8 items-center justify-center p-0 text-base leading-none"
                      aria-label={`Uvećaj ${item.name}`}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <form className="mt-5 space-y-4" onSubmit={handleOrderSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="field sm:col-span-2">
              Ime i prezime
              <input
                type="text"
                value={checkoutForm.customerName}
                onChange={(event) => updateCheckoutField("customerName", event.target.value)}
                placeholder="npr. Marko Marković"
                required
              />
            </label>

            <label className="field">
              Email adresa
              <input
                type="email"
                value={checkoutForm.customerEmail}
                onChange={(event) => updateCheckoutField("customerEmail", event.target.value)}
                placeholder="ime@firma.rs"
                required
              />
            </label>

            <label className="field">
              Broj telefona (Srbija)
              <input
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={checkoutForm.customerPhone}
                onChange={(event) => updateCheckoutField("customerPhone", event.target.value)}
                placeholder="+381 64 123 4567"
                required
              />
            </label>

            <label className="field sm:col-span-2">
              Adresa događaja
              <input
                type="text"
                value={checkoutForm.eventAddress}
                onChange={(event) => updateCheckoutField("eventAddress", event.target.value)}
                placeholder="npr. Bulevar kralja Aleksandra 73"
                required
              />
            </label>

            <label className="field">
              Datum
              <DatePicker
                value={checkoutForm.eventDate}
                onChange={(value) => updateCheckoutField("eventDate", value)}
                required
              />
            </label>

            <label className="field">
              Vreme
              <TimePicker
                value={checkoutForm.eventTime}
                onChange={(value) => updateCheckoutField("eventTime", value)}
                minTime={orderTimeBounds.min ?? undefined}
                maxTime={orderTimeBounds.max ?? undefined}
                required
              />
              <span className="mt-2 block text-xs text-slate-500">
                Radno vreme: {formatWorkingHoursLabel(restaurant)}
                {orderTimeBounds.min && orderTimeBounds.max
                  ? ` · Porudžbine od ${orderTimeBounds.min} do ${orderTimeBounds.max}`
                  : " · Nema dostupnog termina za poručivanje"}
              </span>
            </label>
          </div>

          <label className="field">
            Napomena za restoran
            <input
              type="text"
              value={checkoutForm.note}
              onChange={(event) => updateCheckoutField("note", event.target.value)}
              placeholder="npr. bez kikirikija, dostava na recepciju"
            />
          </label>

          <div className="space-y-2 rounded-2xl bg-slate-50 p-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Međuzbir</span>
              <span className="font-semibold text-slate-900">{formatRsd(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Dostava</span>
              <span className="font-semibold text-slate-900">
                {cartItems.length ? restaurant.deliveryFee : "0 RSD"}
              </span>
            </div>
            <div className="h-px bg-slate-200" />
            <div className="flex items-center justify-between text-base">
              <span className="font-bold text-slate-900">Ukupno</span>
              <span className="font-bold text-slate-900">{formatRsd(total)}</span>
            </div>
          </div>

          {submitError ? (
            <p className="rounded-2xl bg-rose-100 px-4 py-3 text-sm font-medium text-rose-900">{submitError}</p>
          ) : null}

          {submitSuccess ? (
            <p className="rounded-2xl bg-emerald-100 px-4 py-3 text-sm font-medium text-emerald-900">
              {submitSuccess}
            </p>
          ) : null}

          {fallbackSmsLink ? (
            <a
              href={fallbackSmsLink}
              className="cta-secondary inline-flex items-center justify-center"
            >
              Otvori SMS poruku
            </a>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <button className="cta-main" type="submit" disabled={!canSubmitOrder}>
              {isSubmitting ? "Šaljem..." : "Pošalji porudžbinu"}
            </button>
            <button className="cta-secondary" type="button" onClick={clearCheckout} disabled={!cartItems.length || isSubmitting}>
              Isprazni korpu
            </button>
          </div>
        </form>
        </div>
      </aside>
    </section>
  );
}
