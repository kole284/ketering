import { beforeEach, describe, expect, it } from "vitest";
import {
  checkRateLimit,
  getRateLimitBucketCountForTests,
  getRateLimitKey,
  resetRateLimitForTests,
} from "@/lib/server/rate-limit";

describe("rate limit", () => {
  beforeEach(() => {
    resetRateLimitForTests();
  });

  it("returns retry-after when the limit is exceeded", () => {
    expect(checkRateLimit({ key: "orders:1", limit: 1, windowMs: 10_000, now: 1_000 })).toEqual({
      allowed: true,
      retryAfterSeconds: 0,
    });

    expect(checkRateLimit({ key: "orders:1", limit: 1, windowMs: 10_000, now: 2_000 })).toEqual({
      allowed: false,
      retryAfterSeconds: 9,
    });
  });

  it("cleans expired buckets and enforces a memory cap", () => {
    checkRateLimit({ key: "orders:old", limit: 1, windowMs: 100, now: 1_000 });
    checkRateLimit({ key: "orders:new-1", limit: 1, windowMs: 10_000, now: 2_000, maxBuckets: 1 });
    checkRateLimit({ key: "orders:new-2", limit: 1, windowMs: 10_000, now: 2_001, maxBuckets: 1 });

    expect(getRateLimitBucketCountForTests()).toBeLessThanOrEqual(2);
  });

  it("sanitizes client identity headers", () => {
    const request = new Request("http://localhost/api/orders", {
      headers: {
        "x-forwarded-for": "bad/value",
      },
    });

    expect(getRateLimitKey(request)).toBe("anonymous");
  });
});
