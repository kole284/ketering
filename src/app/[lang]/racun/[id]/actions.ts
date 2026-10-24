"use server";

import { refresh } from "next/cache";
import type { BillStatus } from "@/generated/prisma/client";
import { advanceBill } from "@/server/bills";

export async function advance(id: string, signature: string, from: BillStatus) {
  await advanceBill(id, signature, from);
  refresh();
}
