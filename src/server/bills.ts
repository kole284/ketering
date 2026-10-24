import "server-only";
import type { BillStatus } from "@/generated/prisma/client";
import { prisma } from "./db";
import { verify } from "./signing";

/** The restaurant's next step for a bill, or null when it is done. */
export function nextBillStatus(bill: {
  status: BillStatus;
  fulfilment: "delivery" | "pickup";
}): Exclude<BillStatus, "new" | "cancelled"> | null {
  if (bill.status === "new") return "confirmed";
  if (bill.status === "confirmed") return "ready";
  if (bill.status === "ready") return bill.fulfilment === "delivery" ? "delivered" : "picked_up";
  return null;
}

/** A bill for its restaurant, opened from the signed link in the order email. */
export async function getBillForRestaurant(id: string, signature: string | undefined) {
  if (!verify("bill", id, signature)) return null;
  return prisma.bill.findUnique({
    where: { id },
    include: { items: { orderBy: { sortOrder: "asc" } }, order: true },
  });
}

/** Moves a paid order's bill one step on; `from` keeps a double click from skipping a step. */
export async function advanceBill(id: string, signature: string, from: BillStatus) {
  const bill = await getBillForRestaurant(id, signature);
  if (!bill || bill.order.status !== "paid" || bill.status !== from) return;
  const next = nextBillStatus(bill);
  if (next) await prisma.bill.updateMany({ where: { id, status: from }, data: { status: next } });
}
