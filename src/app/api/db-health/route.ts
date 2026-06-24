import { NextResponse } from "next/server";
import { query } from "@/lib/server/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    const result = await query<{ now: string }>("SELECT NOW()::text AS now");

    return NextResponse.json(
      {
        status: "ok",
        db: "connected",
        now: result.rows[0]?.now ?? null,
      },
      {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
          "Expires": "0",
        },
      }
    );
  } catch (error) {
    console.error("GET /api/db-health failed", error);
    const message = error instanceof Error ? error.message : "unknown-error";
    return NextResponse.json(
      {
        status: "error",
        db: "disconnected",
        reason: process.env.NODE_ENV === "development" ? message : undefined,
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
          "Expires": "0",
        },
      }
    );
  }
}
