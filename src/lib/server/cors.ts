import { getOptionalServerEnv } from "@/lib/server/env";

export function getCorsHeaders(request?: Request): HeadersInit {
  const env = getOptionalServerEnv();
  const configuredOrigins = (env.CORS_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  const requestOrigin = request?.headers.get("origin") ?? "";
  const allowOrigin = configuredOrigins.includes("*")
    ? "*"
    : requestOrigin && configuredOrigins.includes(requestOrigin)
      ? requestOrigin
      : "";

  return {
    ...(allowOrigin ? { "Access-Control-Allow-Origin": allowOrigin } : {}),
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Idempotency-Key, X-Order-Access-Token",
    "Access-Control-Expose-Headers": "x-data-source",
    "Vary": "Origin",
  };
}

export function noStoreHeaders(extra?: HeadersInit): HeadersInit {
  return {
    "Cache-Control": "no-cache, no-store, must-revalidate",
    "Pragma": "no-cache",
    "Expires": "0",
    ...extra,
  };
}
