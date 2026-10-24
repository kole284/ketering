import { NextResponse } from "next/server";
import { cancelExpiredOrders } from "@/server/orders";
import { safeEqual } from "@/server/signing";

/**
 * Daily Vercel Cron (vercel.json). Orders already count as cancelled once their payment window
 * passes; this only writes that down. Vercel sends CRON_SECRET as a bearer token.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || !safeEqual(request.headers.get("authorization") ?? "", `Bearer ${secret}`)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const cancelled = await cancelExpiredOrders();
  return NextResponse.json({ cancelled });
}
