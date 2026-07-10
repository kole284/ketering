type RateLimitBucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, RateLimitBucket>();
const DEFAULT_MAX_BUCKETS = 10_000;

export type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

function cleanupExpiredBuckets(now: number): void {
  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
}

function enforceMaxBuckets(maxBuckets: number): void {
  while (buckets.size > maxBuckets) {
    const oldestKey = buckets.keys().next().value as string | undefined;

    if (!oldestKey) {
      return;
    }

    buckets.delete(oldestKey);
  }
}

export function checkRateLimit(input: {
  key: string;
  limit: number;
  windowMs: number;
  now?: number;
  maxBuckets?: number;
}): RateLimitResult {
  const now = input.now ?? Date.now();
  cleanupExpiredBuckets(now);
  enforceMaxBuckets(input.maxBuckets ?? DEFAULT_MAX_BUCKETS);

  const existing = buckets.get(input.key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(input.key, {
      count: 1,
      resetAt: now + input.windowMs,
    });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));

  if (existing.count >= input.limit) {
    return { allowed: false, retryAfterSeconds };
  }

  existing.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

export function getRateLimitKey(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();
  const candidate = forwardedFor || realIp || "anonymous";

  if (!/^[A-Za-z0-9:., _-]{1,128}$/.test(candidate)) {
    return "anonymous";
  }

  return candidate;
}

export function resetRateLimitForTests(): void {
  buckets.clear();
}

export function getRateLimitBucketCountForTests(): number {
  return buckets.size;
}
