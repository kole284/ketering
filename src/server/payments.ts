import "server-only";
import { randomToken, sign, verify } from "./signing";

/** What the provider reported about one payment attempt. */
export type PaymentResult = {
  publicCode: string;
  providerRef: string;
  amountRsd: number;
  succeeded: boolean;
  raw: Record<string, string>;
};

export interface PaymentProvider {
  name: string;
  /** Address of the provider's payment page for this attempt. */
  startPayment(order: { publicCode: string; totalRsd: number; locale: string }): string;
  /** Reads what the provider posted back; null when it is not signed by the provider. */
  parseCallback(form: URLSearchParams): PaymentResult | null;
}

/**
 * Stand-in for the bank's hosted payment page until a bank is chosen (phase 4 of the plan).
 * Its page lives at /[lang]/placanje/test-banka and posts back to /api/payments/callback,
 * the way NestPay and similar providers post to the shop's return URL.
 */
export const testBank = {
  name: "test-bank",
  startPayment({ publicCode, totalRsd, locale }) {
    const ref = randomToken(9);
    const params = new URLSearchParams({ order: publicCode, amount: String(totalRsd), ref });
    params.set("sig", sign("test-bank-page", params.toString()));
    return `/${locale}/placanje/test-banka?${params}`;
  },
  parseCallback(form) {
    const raw = Object.fromEntries(form) as Record<string, string>;
    const { order, amount, ref, result, sig } = raw;
    if (!order || !amount || !ref || (result !== "ok" && result !== "fail")) return null;
    if (!verify("test-bank-result", testBankResultPayload(order, amount, ref, result), sig)) return null;
    return { publicCode: order, providerRef: ref, amountRsd: Number(amount), succeeded: result === "ok", raw };
  },
} satisfies PaymentProvider;

export const testBankResultPayload = (order: string, amount: string, ref: string, result: "ok" | "fail") =>
  [order, amount, ref, result].join("|");

/** The test bank never takes real money, so production uses it only when PAYMENT_PROVIDER says so. */
export function paymentProvider(): PaymentProvider | null {
  const chosen = process.env.PAYMENT_PROVIDER ?? (process.env.VERCEL_ENV === "production" ? undefined : "test-bank");
  return chosen === "test-bank" ? testBank : null;
}

export function providerByName(name: string): PaymentProvider | null {
  return name === testBank.name ? testBank : null;
}
