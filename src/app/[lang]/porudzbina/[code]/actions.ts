"use server";

import { redirect } from "next/navigation";
import { retryPayment } from "@/server/orders";

/** Opens a new payment attempt for a failed or unpaid order. */
export async function retry(code: string, token: string) {
  const url = await retryPayment(code, token);
  if (url) redirect(url);
}
