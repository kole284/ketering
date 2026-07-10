import { describe, expect, it } from "vitest";
import {
  generateOrderAccessToken,
  hashOrderAccessToken,
  verifyOrderAccessToken,
} from "@/lib/server/order-access-token";

describe("order access token", () => {
  it("generates a non-trivial token and verifies only its hash", () => {
    const token = generateOrderAccessToken();
    const hash = hashOrderAccessToken(token);

    expect(token.length).toBeGreaterThanOrEqual(32);
    expect(hash).not.toContain(token);
    expect(verifyOrderAccessToken(token, hash)).toBe(true);
    expect(verifyOrderAccessToken(`${token}x`, hash)).toBe(false);
  });
});
