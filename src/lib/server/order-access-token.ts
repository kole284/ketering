import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

const ACCESS_TOKEN_BYTES = 32;

export function generateOrderAccessToken(): string {
  return randomBytes(ACCESS_TOKEN_BYTES).toString("base64url");
}

export function hashOrderAccessToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function verifyOrderAccessToken(token: string, expectedHash: string): boolean {
  const actual = Buffer.from(hashOrderAccessToken(token), "hex");
  const expected = Buffer.from(expectedHash, "hex");

  if (actual.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(actual, expected);
}
