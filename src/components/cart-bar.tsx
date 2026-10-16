"use client";

import { useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cartDetails, useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/menu";

/** Sticky bottom bar with the cart amount. Before checkout it offers drinks, like a "anything else?" upsell. */
export function CartBar({ offerDrinks = true, nextLabel = "Idi na plaćanje" }: { offerDrinks?: boolean; nextLabel?: string }) {
  const cart = cartDetails(useCart());
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);

  const next = () => {
    if (offerDrinks && !cart.hasDrinks) dialog.current?.showModal();
    else router.push("/korpa");
  };

  return (
    <>
      <div className="sticky bottom-0 z-20 mt-12 border-t border-line bg-bg">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-4 py-3 md:px-6 md:py-4 xl:px-12">
          <p className="flex flex-col md:flex-row md:items-baseline md:gap-2">
            <span className="text-sm text-muted md:text-[15px]">Iznos u korpi</span>
            <span className="text-lg font-medium tabular-nums md:text-xl">{formatPrice(cart.subtotal)}</span>
          </p>
          <button
            type="button"
            onClick={next}
            disabled={cart.count === 0}
            className="h-12 rounded-full bg-accent px-7 text-[15px] font-semibold text-on-accent transition-colors hover:bg-accent-strong disabled:bg-surface disabled:text-muted"
          >
            {nextLabel}
          </button>
        </div>
      </div>

      <dialog
        ref={dialog}
        aria-labelledby="pice-naslov"
        className="m-auto w-[calc(100%-32px)] max-w-md rounded-3xl p-0 backdrop:bg-ink/40"
      >
        <div className="flex flex-col gap-6 p-6 md:p-8">
          <div>
            <h2 id="pice-naslov" className="text-2xl font-medium tracking-[-0.01em]">
              Da li želite piće?
            </h2>
            <p className="mt-2 text-[15px] text-muted">
              Sokovi, voda, pivo i vino u pakovanjima, dostavljeni zajedno sa porudžbinom.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row-reverse">
            <Link
              href="/pica"
              className="flex h-12 flex-1 items-center justify-center rounded-full bg-accent text-[15px] font-semibold text-on-accent hover:bg-accent-strong"
            >
              Da, pogledaj pića
            </Link>
            <Link
              href="/korpa"
              className="flex h-12 flex-1 items-center justify-center rounded-full border border-ink text-[15px] font-medium"
            >
              Ne, nastavi
            </Link>
          </div>
        </div>
      </dialog>
    </>
  );
}
