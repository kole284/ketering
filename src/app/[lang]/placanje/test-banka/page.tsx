import { Suspense } from "react";
import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { fill } from "@/i18n/config";
import { getDictionary } from "@/i18n/server";
import { formatPrice } from "@/lib/menu";
import { paymentProvider, testBank, testBankResultPayload } from "@/server/payments";
import { sign, verify } from "@/server/signing";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: `${t.testBank.title} | Servingo`, robots: { index: false } };
}

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

/** Stand-in for the bank's payment page: the two buttons post the outcome back like a bank would. */
async function TestBank({ searchParams }: Pick<PageProps<"/[lang]/placanje/test-banka">, "searchParams">) {
  const { locale, t } = await getDictionary();
  const params = await searchParams;
  const order = first(params.order) ?? "";
  const amount = first(params.amount) ?? "";
  const ref = first(params.ref) ?? "";
  const valid =
    paymentProvider()?.name === testBank.name &&
    verify("test-bank-page", new URLSearchParams({ order, amount, ref }).toString(), first(params.sig));

  if (!valid) return <p className="text-lg text-muted">{t.testBank.invalid}</p>;

  const outcome = (result: "ok" | "fail") => (
    <form method="post" action="/api/payments/callback">
      <input type="hidden" name="order" value={order} />
      <input type="hidden" name="amount" value={amount} />
      <input type="hidden" name="ref" value={ref} />
      <input type="hidden" name="result" value={result} />
      <input type="hidden" name="sig" value={sign("test-bank-result", testBankResultPayload(order, amount, ref, result))} />
      <button
        type="submit"
        className={
          result === "ok"
            ? "h-14 w-full caps-cta bg-cta px-7 text-on-cta hover:bg-cta-strong"
            : "h-14 w-full caps border border-ink px-7 hover:bg-surface"
        }
      >
        {result === "ok" ? fill(t.testBank.pay, { amount: formatPrice(Number(amount), locale, t) }) : t.testBank.decline}
      </button>
    </form>
  );

  return (
    <div className="flex max-w-md flex-col gap-6 border border-line p-6 md:p-8">
      <p className="text-lg font-medium">{fill(t.testBank.order, { code: order })}</p>
      <p className="text-3xl font-medium tabular-nums">{formatPrice(Number(amount), locale, t)}</p>
      <div className="flex flex-col gap-3">
        {outcome("ok")}
        {outcome("fail")}
      </div>
    </div>
  );
}

export default async function TestBankPage({ searchParams }: PageProps<"/[lang]/placanje/test-banka">) {
  const { t } = await getDictionary();
  return (
    <PageShell title={t.testBank.title} intro={t.testBank.text}>
      <Suspense>
        <TestBank searchParams={searchParams} />
      </Suspense>
    </PageShell>
  );
}
