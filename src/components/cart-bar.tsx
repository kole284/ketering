"use client";

import { useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useI18n } from "@/i18n/provider";
import { cartDetails, useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/menu";

/** Sticky bottom bar with the cart amount. Before checkout it offers drinks, like a "anything else?" upsell. */
export function CartBar({ offerDrinks = true }: { offerDrinks?: boolean }) {
  const { locale, t, href } = useI18n();
  const cart = cartDetails(useCart());
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);

  const next = () => {
    if (offerDrinks && !cart.hasDrinks) dialog.current?.showModal();
    else router.push(href("/korpa"));
  };

  return (
    <>
      <div className="sticky bottom-0 z-20 mt-12 border-t border-line bg-bg">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-4 py-3 md:px-6 md:py-4 xl:px-12">
          <p className="flex flex-col md:flex-row md:items-baseline md:gap-2">
            <span className="text-sm text-muted md:text-[15px]">{t.menu.cartAmount}</span>
            <span className="text-lg font-medium tabular-nums md:text-xl">{formatPrice(cart.subtotal, locale, t)}</span>
          </p>
          <button
            type="button"
            onClick={next}
            disabled={cart.count === 0}
            className="h-12 caps bg-accent px-7 text-on-accent transition-colors hover:bg-accent-strong disabled:bg-surface disabled:text-muted"
          >
            {offerDrinks ? t.menu.goToPayment : t.menu.continueToCart}
          </button>
        </div>
      </div>

      <dialog
        ref={dialog}
        aria-labelledby="pice-naslov"
        className="m-auto w-[calc(100%-32px)] max-w-md p-0 backdrop:bg-ink/40"
      >
        <div className="flex flex-col gap-6 p-6 md:p-8">
          <div>
            <h2 id="pice-naslov" className="text-2xl font-medium tracking-[-0.01em]">
              {t.menu.drinksQuestion}
            </h2>
            <p className="mt-2 text-[15px] text-muted">
              {t.menu.drinksText}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row-reverse">
            <Link
              href={href("/pica")}
              className="flex h-12 flex-1 items-center justify-center caps bg-accent text-on-accent hover:bg-accent-strong"
            >
              {t.menu.drinksYes}
            </Link>
            <Link
              href={href("/korpa")}
              className="flex h-12 flex-1 items-center justify-center caps border border-ink"
            >
              {t.menu.drinksNo}
            </Link>
          </div>
        </div>
      </dialog>
    </>
  );
}
