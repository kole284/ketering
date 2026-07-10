import { NextResponse } from "next/server";
import { ApplicationError, toApplicationError } from "@/lib/server/errors";

export type ApiSuccess<T> = {
  success: true;
  data: T;
};

export type ApiFailure = {
  success: false;
  error: {
    code: string;
    message: string;
  };
};

export function successResponse<T>(
  data: T,
  init?: ResponseInit,
): NextResponse<ApiSuccess<T>> {
  return NextResponse.json({ success: true, data }, init);
}

export function errorResponse(error: unknown, init?: ResponseInit): NextResponse<ApiFailure> {
  const appError = error instanceof ApplicationError ? error : toApplicationError(error);
  const message = appError.expose || process.env.NODE_ENV === "development"
    ? appError.message
    : "Došlo je do neočekivane greške.";

  return NextResponse.json(
    {
      success: false,
      error: {
        code: appError.code,
        message,
      },
    },
    {
      ...init,
      status: appError.status,
      headers: {
        ...Object.fromEntries(new Headers(init?.headers).entries()),
      },
    },
  );
}
