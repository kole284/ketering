import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { fill, localePath } from "@/i18n/config";
import { getDictionary } from "@/i18n/server";
import { formatDate, slotLabel } from "@/lib/booking";
import { formatPrice, formatQuantity } from "@/lib/menu";
import { effectiveStatus, getOrderForCustomer } from "@/server/orders";
import { retry } from "./actions";
import { ClearPlacedCart } from "./clear-placed-cart";

export async function generateMetadata({ params }: PageProps<"/[lang]/porudzbina/[code]">): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: `${fill(t.order.title, { code: (await params).code })} | Servingo`, robots: { index: false } };
}

// Private, per-visitor page: there is no static shell to prerender for an unknown code.
export const instant = false;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

async function OrderStatus({ params, searchParams }: PageProps<"/[lang]/porudzbina/[code]">) {
  const { locale, t } = await getDictionary();
  const { code } = await params;
  const token = first((await searchParams).t);
  const order = await getOrderForCustomer(code, token);
  const price = (amount: number) => formatPrice(amount, locale, t);

  if (!order) {
    return (
      <PageShell title={t.order.notFound} intro={t.order.notFoundText}>
        <Link href={localePath(locale, "/")} className="inline-flex h-12 items-center caps border border-ink px-7">
          {t.order.home}
        </Link>
      </PageShell>
    );
  }

  const status = effectiveStatus(order) as keyof typeof t.order.status;
  const text = {
    paid: fill(t.order.paidText, { email: order.email }),
    pending_payment: t.order.pendingText,
    payment_failed: t.order.failedText,
    cancelled: t.order.cancelledText,
    refunded: t.order.refundedText,
  }[status];
  const canPay = status === "pending_payment" || status === "payment_failed";

  return (
    <PageShell title={fill(t.order.title, { code: order.publicCode })}>
      {status === "paid" && <ClearPlacedCart code={order.publicCode} />}
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_380px] lg:items-start">
        <div className="flex min-w-0 max-w-2xl flex-col gap-10">
          <div role="status" className={`border-l-2 px-4 py-3 ${status === "paid" ? "border-cta bg-accent-soft" : "border-ink bg-surface"}`}>
            <p className="text-lg font-medium">{t.order.status[status]}</p>
            <p className="mt-1 text-[15px]">{text}</p>
          </div>

          <div className="flex flex-col gap-1">
            <p className="text-[13px] text-muted">{t.order.slot}</p>
            <p className="text-lg">
              {formatDate(order.deliveryDate.toISOString().slice(0, 10), locale)}, {slotLabel(order.slotHour)}
            </p>
          </div>

          {order.bills.map((bill) => (
            <section key={bill.id} aria-labelledby={`racun-${bill.id}`}>
              <h2 id={`racun-${bill.id}`} className="caps-title border-b border-ink pb-3 text-base">
                {bill.sellerName}
              </h2>
              <ul>
                {bill.items.map((item) => (
                  <li key={item.id} className="flex justify-between gap-4 border-b border-line py-4 text-[15px]">
                    <span>
                      {item.name} <span className="text-muted">· {formatQuantity(item, item.quantityTenths / 10, locale, t)}</span>
                    </span>
                    <span className="tabular-nums">{price(item.lineTotalRsd)}</span>
                  </li>
                ))}
              </ul>
              <dl className="mt-4 flex flex-col gap-2 text-[15px] md:ml-auto md:max-w-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">{bill.fulfilment === "delivery" ? t.cart.delivery : t.cart.pickup}</dt>
                  <dd className="tabular-nums">{price(bill.deliveryFeeRsd)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">{t.cart.platform}</dt>
                  <dd className="tabular-nums">{price(bill.platformFeeRsd)}</dd>
                </div>
                <div className="flex justify-between gap-4 border-t border-ink pt-3 font-medium">
                  <dt>{t.cart.billTotal}</dt>
                  <dd className="tabular-nums">{price(bill.totalRsd)}</dd>
                </div>
              </dl>
            </section>
          ))}
        </div>

        <div className="flex flex-col gap-5 bg-surface p-5 md:p-6 lg:sticky lg:top-[calc(var(--header-h)+24px)]">
          <dl className="flex justify-between gap-4 text-lg font-medium">
            <dt>{t.cart.grandTotal}</dt>
            <dd className="tabular-nums">{price(order.totalRsd)}</dd>
          </dl>
          {canPay ? (
            <form action={retry.bind(null, order.publicCode, order.accessToken)}>
              <button type="submit" className="h-14 w-full caps-cta bg-cta text-on-cta hover:bg-cta-strong">
                {status === "payment_failed" ? t.order.retry : fill(t.order.pay, { amount: price(order.totalRsd) })}
              </button>
            </form>
          ) : (
            <Link href={localePath(locale, "/")} className="flex h-12 items-center justify-center caps border border-ink">
              {t.order.home}
            </Link>
          )}
        </div>
      </div>
    </PageShell>
  );
}

export default function OrderPage(props: PageProps<"/[lang]/porudzbina/[code]">) {
  return (
    <Suspense>
      <OrderStatus {...props} />
    </Suspense>
  );
}
