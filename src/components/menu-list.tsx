"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { fill } from "@/i18n/config";
import { useI18n } from "@/i18n/provider";
import { parseBooking, serviceLabel, SERVICES } from "@/lib/booking";
import { SERVINGO_SELLER, addToCart, lineKey, setBooking, setQuantity, useCart, type Seller } from "@/lib/cart";
import { formatPrice, formatQuantity, priceLabel, type MenuItem } from "@/lib/menu";
import { MinusIcon, PlusIcon, TrashIcon } from "./icons";

type Group = { key: string; title: string; items: MenuItem[] };

const sectionId = (key: string) => `grupa-${key}`;

/** Glovo-style round "+" that adds the smallest quantity in one tap. */
function AddButton({ item, onAdd, className = "" }: { item: MenuItem; onAdd: (item: MenuItem) => void; className?: string }) {
  const { t } = useI18n();
  return (
    <button
      type="button"
      onClick={() => onAdd(item)}
      className={`flex size-11 items-center justify-center rounded-full bg-surface transition-colors hover:bg-cta hover:text-on-cta ${className}`}
    >
      <PlusIcon size={20} />
      <span className="sr-only">{fill(t.menu.addItem, { name: item.name })}</span>
    </button>
  );
}

/** Shown under an item once it is in the cart: trash/minus, quantity, plus. */
function InCartBox({ item, quantity, cartKey }: { item: MenuItem; quantity: number; cartKey: string }) {
  const { locale, t } = useI18n();
  const atMin = quantity <= item.min;
  const change = (delta: number) => setQuantity(cartKey, Math.round((quantity + delta) * 10) / 10);

  return (
    <div className="col-span-full flex items-center justify-between gap-4 border border-line px-4 py-4 md:px-5">
      <div className="min-w-0">
        <p className="truncate text-[15px]">{item.name}</p>
        <p className="text-[15px] font-medium tabular-nums">{formatPrice(item.price * quantity, locale, t)}</p>
      </div>
      <div className="flex h-11 shrink-0 items-center rounded-full bg-surface">
        <button
          type="button"
          onClick={() => (atMin ? setQuantity(cartKey, 0) : change(-item.step))}
          className="flex size-11 items-center justify-center"
        >
          {atMin ? <TrashIcon size={18} /> : <MinusIcon size={18} />}
          <span className="sr-only">{atMin ? t.menu.remove : t.menu.decrease}</span>
        </button>
        <span className="min-w-14 text-center text-sm font-medium tabular-nums" aria-live="polite">
          {formatQuantity(item, quantity, locale, t)}
        </span>
        <button type="button" onClick={() => change(item.step)} className="flex size-11 items-center justify-center">
          <PlusIcon size={18} />
          <span className="sr-only">{t.menu.increase}</span>
        </button>
      </div>
    </div>
  );
}

function MenuRow({
  item,
  quantity,
  cartKey,
  onAdd,
}: {
  item: MenuItem;
  quantity?: number;
  cartKey: string;
  onAdd: (item: MenuItem) => void;
}) {
  const { locale, t } = useI18n();

  return (
    <li className="grid grid-cols-[88px_1fr] gap-x-4 gap-y-4 border-b border-line py-6 md:grid-cols-[120px_1fr_auto] md:gap-x-8">
      {/* Photo placeholder until restaurants upload real images. */}
      <div className="aspect-square bg-surface" role="img" aria-label={fill(t.restaurants.photo, { name: item.name })} />
      <div className="flex min-w-0 flex-col gap-1.5">
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-lg leading-snug md:text-xl">{item.name}</h3>
          <p className="shrink-0 pt-0.5 text-[15px] tabular-nums md:hidden">{formatPrice(item.price, locale, t)}</p>
        </div>
        <p className="text-[15px] text-muted">{item.description}</p>
        <p className="text-sm text-muted">{priceLabel(item, locale, t)}</p>
      </div>
      <div className="col-span-full flex justify-end md:col-span-1 md:flex-col md:items-end md:justify-between">
        <p className="hidden text-[15px] tabular-nums md:block">{formatPrice(item.price, locale, t)}</p>
        <AddButton item={item} onAdd={onAdd} />
      </div>
      {quantity !== undefined && <InCartBox item={item} quantity={quantity} cartKey={cartKey} />}
    </li>
  );
}

function Bestsellers({ items, onAdd }: { items: MenuItem[]; onAdd: (item: MenuItem) => void }) {
  const { locale, t } = useI18n();
  return (
    <ul className="-mx-4 flex snap-x scroll-px-4 gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:scroll-px-0 md:px-0">
      {items.map((item) => (
        <li key={item.id} className="w-40 shrink-0 snap-start md:w-52">
          <div className="relative aspect-square bg-surface" role="img" aria-label={fill(t.restaurants.photo, { name: item.name })}>
            <AddButton item={item} onAdd={onAdd} className="absolute right-2 bottom-2 bg-bg" />
          </div>
          <p className="mt-3 line-clamp-2 text-[15px] leading-snug">{item.name}</p>
          <p className="mt-1 text-[15px] font-medium tabular-nums">{formatPrice(item.price, locale, t)}</p>
        </li>
      ))}
    </ul>
  );
}

/** Sticky category tabs that follow scrolling, like Glovo. */
function CategoryTabs({ groups }: { groups: Group[] }) {
  const [active, setActive] = useState(groups[0]?.key);
  const tabs = useRef<HTMLUListElement>(null);
  const keys = groups.map((group) => group.key).join(",");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id.replace("grupa-", ""));
      },
      // A section counts as current while it crosses the band just under the sticky bars.
      { rootMargin: "-160px 0px -55% 0px" },
    );
    for (const key of keys.split(",")) {
      const el = document.getElementById(sectionId(key));
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [keys]);

  useEffect(() => {
    const tab = tabs.current?.querySelector<HTMLElement>(`[data-key="${active}"]`);
    if (tab && tabs.current) tabs.current.scrollTo({ left: tab.offsetLeft - 16, behavior: "smooth" });
  }, [active]);

  return (
    <nav className="sticky top-[var(--header-h)] z-20 -mx-4 border-b border-line bg-bg px-4 md:-mx-6 md:px-6 xl:mx-0 xl:px-0">
      <ul ref={tabs} className="relative flex gap-8 overflow-x-auto [scrollbar-width:none]">
        {groups.map((group) => (
          <li key={group.key} data-key={group.key} className="shrink-0">
            <a
              href={`#${sectionId(group.key)}`}
              aria-current={active === group.key ? "true" : undefined}
              className="caps block border-b-2 border-transparent py-4 text-muted aria-current:border-ink aria-current:text-ink"
            >
              {group.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function MenuList({
  items,
  restaurant,
}: {
  items: MenuItem[];
  /** The restaurant being viewed. On the drinks page it comes from ?restoran=, set by the drinks prompt. */
  restaurant?: Seller;
}) {
  const { t } = useI18n();
  const cart = useCart();
  const params = useSearchParams();
  // Everything listed goes on one bill: the restaurant's, with its drinks, or Servingo's own for drinks alone.
  const seller = restaurant ?? SERVINGO_SELLER;
  const keyFor = (item: MenuItem) => lineKey({ itemId: item.id, restaurantId: seller.id });
  const inCart = new Map(cart.lines.map((line) => [lineKey(line), line.quantity]));

  const add = (item: MenuItem) => {
    addToCart(item, item.min, seller);
    // Remember the slot and method chosen on the homepage so checkout can show them.
    const booking = parseBooking(Object.fromEntries(params));
    setBooking({ date: booking.date, hour: booking.hour, method: booking.method });
  };

  const popular = items.filter((item) => item.popular);
  const groups: Group[] = [
    ...(popular.length > 0 ? [{ key: "najprodavanije", title: t.menu.bestsellers, items: popular }] : []),
    ...SERVICES.map((service) => ({
      key: service.id,
      title: serviceLabel(service.id, t),
      items: items.filter((item) => item.service === service.id),
    })).filter((group) => group.items.length > 0),
  ];

  return (
    <div>
      <CategoryTabs groups={groups} />
      <div className="flex flex-col gap-14 pt-10">
        {groups.map((group) => (
          <section
            key={group.key}
            id={sectionId(group.key)}
            aria-labelledby={`${sectionId(group.key)}-naslov`}
            className="scroll-mt-[calc(var(--header-h)+72px)]"
          >
            <h2 id={`${sectionId(group.key)}-naslov`} className="caps-title mb-6 text-lg md:text-xl">
              {group.title}
            </h2>
            {group.key === "najprodavanije" ? (
              <Bestsellers items={group.items} onAdd={add} />
            ) : (
              <ul className="border-t border-line">
                {group.items.map((item) => (
                  <MenuRow
                    key={item.id}
                    item={item}
                    quantity={inCart.get(keyFor(item))}
                    cartKey={keyFor(item)}
                    onAdd={add}
                  />
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
