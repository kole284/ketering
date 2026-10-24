import { Suspense } from "react";
import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { dictionaryFor } from "@/i18n/server";
import { formatDate, slotLabel } from "@/lib/booking";
import { formatPrice, formatQuantity } from "@/lib/menu";
import { getBillForRestaurant, nextBillStatus } from "@/server/bills";
import { advance } from "./actions";

// For restaurant staff, who open it from the order email; always in Serbian.
const t = dictionaryFor("sr");
const price = (amount: number) => formatPrice(amount, "sr", t);

export const metadata: Metadata = { title: "Račun | Servingo", robots: { index: false } };

const STATUS = {
  new: "Nova, čeka potvrdu",
  confirmed: "Potvrđena",
  ready: "Spremna",
  delivered: "Isporučena",
  picked_up: "Preuzeta",
  cancelled: "Otkazana",
} as const;

const ACTION = {
  confirmed: "Potvrdi porudžbinu",
  ready: "Porudžbina je spremna",
  delivered: "Porudžbina je isporučena",
  picked_up: "Kupac je preuzeo porudžbinu",
} as const;

// Private, per-visitor page: there is no static shell to prerender for an unknown code.
export const instant = false;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

async function Bill({ params, searchParams }: PageProps<"/[lang]/racun/[id]">) {
  const { id } = await params;
  const signature = first((await searchParams).sig);
  const bill = await getBillForRestaurant(id, signature);
  if (!bill || bill.order.status !== "paid") {
    return <PageShell title="Račun nije pronađen" intro="Proveri link iz mejla ili se javi Servingu." />;
  }

  const { order } = bill;
  const next = nextBillStatus(bill);
  const rows: [string, string][] = [
    ["Termin", `${formatDate(order.deliveryDate.toISOString().slice(0, 10), "sr")}, ${slotLabel(order.slotHour)}`],
    ["Način", bill.fulfilment === "delivery" ? `Dostava: ${[order.address, order.city].filter(Boolean).join(", ")}` : "Lično preuzimanje u restoranu"],
    ["Kupac", `${order.customerName}, ${order.phone}`],
    ...(order.buyerType === "pravno" ? [["Firma", `${order.companyName}, PIB ${order.pib}`] as [string, string]] : []),
    ["Status", STATUS[bill.status]],
  ];

  return (
    <PageShell title={`${bill.sellerName}: porudžbina ${order.publicCode}`}>
      <div className="flex max-w-2xl flex-col gap-8">
        <dl className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
          {rows.map(([label, value]) => (
            <div key={label} className="flex flex-col gap-0.5">
              <dt className="text-[13px] text-muted">{label}</dt>
              <dd className="text-[15px] font-medium">{value}</dd>
            </div>
          ))}
        </dl>

        <ul className="border-t border-ink">
          {bill.items.map((item) => (
            <li key={item.id} className="flex justify-between gap-4 border-b border-line py-4 text-[15px]">
              <span>
                {item.name} <span className="text-muted">· {formatQuantity(item, item.quantityTenths / 10, "sr", t)}</span>
                {item.isDrink && <span className="text-muted"> · nabavlja Servingo</span>}
              </span>
              <span className="tabular-nums">{price(item.lineTotalRsd)}</span>
            </li>
          ))}
        </ul>
        <p className="flex justify-between gap-4 text-lg font-medium">
          <span>Ukupno za račun</span>
          <span className="tabular-nums">{price(bill.totalRsd)}</span>
        </p>

        {next && (
          <form action={advance.bind(null, bill.id, signature!, bill.status)}>
            <button type="submit" className="h-14 w-full caps-cta bg-cta px-7 text-on-cta hover:bg-cta-strong sm:w-auto">
              {ACTION[next]}
            </button>
          </form>
        )}
      </div>
    </PageShell>
  );
}

export default function BillPage(props: PageProps<"/[lang]/racun/[id]">) {
  return (
    <Suspense>
      <Bill {...props} />
    </Suspense>
  );
}
