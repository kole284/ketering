import { NextResponse } from "next/server";
import { orderStatusUrl } from "@/server/notifications";
import { recordPayment } from "@/server/orders";
import { paymentProvider } from "@/server/payments";

/**
 * Where the payment page sends the customer back with the result, as a browser form POST.
 * The result counts only if the provider's signature checks out; the redirect then shows the order status.
 */
export async function POST(request: Request) {
  const provider = paymentProvider();
  if (!provider) return new NextResponse("Payments are not enabled", { status: 404 });

  const result = provider.parseCallback(new URLSearchParams(await request.text()));
  if (!result) return new NextResponse("Invalid payment result", { status: 400 });

  const recorded = await recordPayment(provider.name, result);
  if (!recorded) return new NextResponse("Unknown order", { status: 404 });

  return NextResponse.redirect(new URL(orderStatusUrl(recorded.order), request.url), 303);
}
