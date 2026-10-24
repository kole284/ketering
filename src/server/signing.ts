import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

function secret() {
  const value = process.env.ORDER_SECRET;
  if (value) return value;
  // Local development only; deployments must set ORDER_SECRET.
  if (process.env.NODE_ENV === "development") return "servingo-dev-only-secret";
  throw new Error("ORDER_SECRET is not set");
}

/** HMAC for links and payment data; `purpose` keeps a signature for one use from passing as another. */
export const sign = (purpose: string, value: string) =>
  createHmac("sha256", secret()).update(`${purpose}:${value}`).digest("base64url");

export function verify(purpose: string, value: string, signature: string | null | undefined) {
  if (!signature) return false;
  return safeEqual(sign(purpose, value), signature);
}

export function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export const randomToken = (bytes = 24) => randomBytes(bytes).toString("base64url");
