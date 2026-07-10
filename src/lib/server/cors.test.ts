import { beforeEach, describe, expect, it } from "vitest";
import { getCorsHeaders } from "@/lib/server/cors";

describe("cors headers", () => {
  beforeEach(() => {
    process.env.CORS_ALLOWED_ORIGINS = "http://localhost:3000,https://app.example.com";
  });

  it("allows a configured browser origin", () => {
    const headers = new Headers(getCorsHeaders(new Request("http://localhost/api", {
      headers: { Origin: "https://app.example.com" },
    })));

    expect(headers.get("Access-Control-Allow-Origin")).toBe("https://app.example.com");
    expect(headers.get("Vary")).toBe("Origin");
  });

  it("does not mirror an unknown origin", () => {
    const headers = new Headers(getCorsHeaders(new Request("http://localhost/api", {
      headers: { Origin: "https://evil.example.com" },
    })));

    expect(headers.get("Access-Control-Allow-Origin")).toBeNull();
  });

  it("allows the idempotency and order access token headers", () => {
    const headers = new Headers(getCorsHeaders(new Request("http://localhost/api", {
      headers: { Origin: "http://localhost:3000" },
    })));

    expect(headers.get("Access-Control-Allow-Headers")).toContain("Idempotency-Key");
    expect(headers.get("Access-Control-Allow-Headers")).toContain("X-Order-Access-Token");
  });
});
